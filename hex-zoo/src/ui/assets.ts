import manifestText from '../../public/art-manifest.json?raw';

export interface ArtAsset {
  path: string | null;
  size: [number, number];
  cutout: boolean;
  label: string;
  runtime: boolean;
}

/** Single source for both optional final images and the import tool. */
export const assetManifest = JSON.parse(manifestText) as Record<string, ArtAsset>;

/** Null means use the existing family-symbol/text placeholder. */
export function getAsset(id: string): string | null {
  const asset = assetManifest[id];
  return asset?.path ? new URL(asset.path, document.baseURI).href : null;
}
