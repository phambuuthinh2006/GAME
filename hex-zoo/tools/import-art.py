#!/usr/bin/env python3
"""Import optional green-screen art; missing inputs keep the game's placeholders.

Install Pillow once (for example: uv pip install --target .pillow pillow), then
PYTHONPATH=.pillow python3 tools/import-art.py. No network is used by this tool.
Manifest/input/output paths are rooted in hex-zoo, never the shell's directory.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public" / "art-manifest.json"


def pixels(image: Image.Image):
    return image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()


def key_green(source: Image.Image) -> Image.Image:
    """Soft green-dominance matte with simple spill suppression on edge pixels."""
    source = source.convert("RGBA")
    result = []
    for r, g, b, a in pixels(source):
        dominance = g - max(r, b)
        # Dark/cyan/olive areas are retained; the prompt background is #00FF00.
        amount = min(1.0, max(0.0, (dominance - 20) / 90)) if g > 70 else 0.0
        amount = amount * amount * (3 - 2 * amount)
        alpha = round(a * (1 - amount))
        if dominance > 8 and g > 70:
            g = min(g, max(r, b) + 8)  # Remove the green halo on surviving edges.
        result.append((r, g, b, alpha))
    out = Image.new("RGBA", source.size)
    out.putdata(result)
    return out


def fit_cutout(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    alpha = image.getchannel("A").point(lambda a: 255 if a > 8 else 0)
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("image contains no visible subject after green removal")
    cropped = image.crop(bounds)
    edge = max(cropped.size)
    padding = max(2, round(edge * 0.08))
    square = Image.new("RGBA", (edge + padding * 2,) * 2, (0, 0, 0, 0))
    square.alpha_composite(cropped, ((square.width - cropped.width) // 2,
                                    (square.height - cropped.height) // 2))
    resized = square.resize(size, Image.Resampling.LANCZOS)
    # Resampling may reintroduce a little color spill; suppress it once more.
    cleaned = Image.new("RGBA", size)
    cleaned.putdata([(r, min(g, max(r, b) + 8), b, a) for r, g, b, a in pixels(resized)])
    return cleaned


def fit_scene(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    # Scene/covers retain their intended aspect ratio; crop centrally, never stretch.
    scale = max(size[0] / image.width, size[1] / image.height)
    scaled = image.convert("RGBA").resize(
        (max(size[0], round(image.width * scale)), max(size[1], round(image.height * scale))),
        Image.Resampling.LANCZOS)
    x, y = (scaled.width - size[0]) // 2, (scaled.height - size[1]) // 2
    return scaled.crop((x, y, x + size[0], y + size[1]))


def palette_save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # FASTOCTREE supports RGBA and stores transparency in the palette PNG.
    image.quantize(colors=256, method=Image.Quantize.FASTOCTREE,
                   dither=Image.Dither.NONE).save(path, format="PNG", optimize=True)


def import_assets(input_dir: Path, output_dir: Path, manifest_path: Path) -> tuple[int, int]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    imported = skipped = 0
    for asset_id, spec in manifest.items():
        source = next((input_dir / f"{asset_id}{ext}" for ext in (".png", ".webp", ".jpg", ".jpeg")
                       if (input_dir / f"{asset_id}{ext}").is_file()), None)
        if source is None:
            skipped += 1
            continue
        size = tuple(spec["size"])
        with Image.open(source) as raw:
            image = raw.convert("RGBA")
        if spec["cutout"]:
            image = fit_cutout(key_green(image), size)
        else:
            image = fit_scene(image, size)
        target = output_dir / f"{asset_id}.png"
        palette_save(image, target)
        spec["path"] = target.relative_to(manifest_path.parent).as_posix()
        print(f"IMPORTED {source.name} → {spec['path']} ({size[0]}×{size[1]})")
        imported += 1
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return imported, skipped


def self_test() -> None:
    from tempfile import TemporaryDirectory
    # Keep all temporary test files inside the requested workspace.
    (ROOT / "artifacts").mkdir(exist_ok=True)
    with TemporaryDirectory(prefix="art-import-", dir=ROOT / "artifacts") as tmp:
        root = Path(tmp)
        (root / "art-in").mkdir()
        (root / "public").mkdir()
        manifest = root / "public" / "art-manifest.json"
        manifest.write_text(json.dumps({"sample": {"path": None, "size": [64, 64], "cutout": True},
                                        "missing": {"path": None, "size": [32, 32], "cutout": True}}))
        sample = Image.new("RGBA", (100, 80), (0, 255, 0, 255))
        # Red subject and a deliberately green contaminated border.
        for y in range(20, 60):
            for x in range(30, 70):
                sample.putpixel((x, y), (210, 35, 40, 255))
        sample.putpixel((29, 40), (90, 150, 80, 255))
        sample.save(root / "art-in" / "sample.png")
        assert import_assets(root / "art-in", root / "public" / "art", manifest) == (1, 1)
        with Image.open(root / "public" / "art" / "sample.png") as result:
            assert result.mode == "P" and result.size == (64, 64)
            rgba = result.convert("RGBA")
            assert rgba.getpixel((0, 0))[3] == 0
            assert rgba.getpixel((32, 32))[3] >= 245
            assert any(0 < a < 255 for _, _, _, a in pixels(rgba))
            assert all(g <= max(r, b) + 12 for r, g, b, a in pixels(rgba) if a > 10)
        parsed = json.loads(manifest.read_text())
        assert parsed["sample"]["path"] == "art/sample.png" and parsed["missing"]["path"] is None
    print("PASS — soft key, spill removal, transparent padding, palette PNG and missing-input fallback")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        imported, skipped = import_assets(ROOT / "art-in", ROOT / "public" / "art", MANIFEST)
        print(f"Done: {imported} imported; {skipped} missing inputs skipped. Restart dev server after importing.")


if __name__ == "__main__":
    main()
