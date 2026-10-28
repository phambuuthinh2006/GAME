# CrazyGames page draft — do not submit with placeholder art

Working title: Hex Zoo. This is a local vertical slice. Final art, title availability checks, comparison with the best competitor, device testing inside the real CrazyGames page and a portal review are still owner tasks. Nothing has been uploaded or submitted.

## Category and tags

Category: **Puzzle**. The focal activity is choosing hexagon positions and reading adjacency combinations under a limited number of placements. A single readable board explains the game better than a collection or simulation category.

Priority tags, in order: **Animal**, **Brain**, **Logic**, **Connect**, **1 Player**.

Backups: **2D**, **Mouse**. All seven are from the supplied portal list. Do not add “Roguelike,” “Deckbuilder,” “Zoo” or “Casual” as tags/category.

## Description — plain text for the portal

Build a tiny zoo with big animal combos! Place colorful animal tiles on a hexagon board, connect matching families, and reach each day's goal in this short zoo puzzle adventure.

How to play
- Tap an animal, then tap an open hexagon, or drag the animal onto the board.
- Match family symbols, use bonus spaces, and read each animal's rule to build a stronger combo.
- Beat the daily score goal before your places run out.
- Choose a new animal or snack after a successful day. Visit the gift shop for snacks and helpful charms.
- Complete 12 days, keep going in Endless, or try the shared Daily Zoo.

Features
- A clear hexagon puzzle board with four animal families and readable family symbols.
- 40 animal tiles with different combo rules, plus snacks and charms to shape your run.
- Event days that change the board and invite a new plan.
- Three keepers, a collection, and seeded runs.
- A Daily Zoo with a named event to come back for tomorrow.

## Controls

Desktop:
- Click an animal tile, then click an empty board cell.
- Or drag an animal tile from your hand onto an empty cell.
- Select a hand tile, open Snacks, and click a snack to use it. Use the on-screen buttons for menus.

Mobile:
- Tap an animal tile, then tap an empty board cell.
- Or drag a tile onto an empty cell.
- Select a hand tile, open Snacks, and tap a snack to use it. All other controls are on screen.

No custom fullscreen control, external account, external links, shortcut keys or runtime fonts/CDNs are required. The CrazyGames build uses only the required SDK v3 script as its platform connection.

## Cover production

Create three compositions in the exact sizes **1920×1080**, **800×1200**, and **800×800** using the prompts in art-prompts.md. All three must match the finished in-game art style and promise only things that appear in actual play.

- Landscape: leave the upper-left area quiet for the CrazyGames New/Updated label. Add the final cleared title as a separate overlay in the right half if desired. No text is generated into the image itself.
- Portrait and square: no text. Keep faces, the focal hexagon and the combo action comfortably within the crop.
- Inspect the landscape at **230×130**; the animal faces, hexagon board and core action must remain clear. Do not use small HUD details or many scattered items.

The importer writes covers to public/art/. They are marketing assets; the Vite build automatically removes them from runtime output. Do not add them to the initial game download.

## Video shot list for owner recording

Record two silent edits: **15–20 seconds**, **1920×1080** and **1080×1620**. Hide the cursor; no black frames, audio, loading screen or lose screen. Start on gameplay. Use actual gameplay, final art and the actual production UI.

- 0–4 s: place an animal beside its matching family; show the score response.
- 4–8 s: show a distinct multiplier combo and reach a day goal.
- 8–12 s: choose an animal, then a short gift-shop purchase shot.
- 12–16 s: show an event board changing the puzzle.
- 16–20 s: show a winning board and the Daily Zoo tomorrow-event line.

Each 3–4 seconds should reveal a different part of the real core loop. Re-edit the sequence if the final cover promises a feature not demonstrated here.

## Local hand-off limits

The SDK implementation can be exercised with local mocks and built-resource checks; real SDK Data persistence, language, mute and ad callbacks need testing inside the authorized CrazyGames preview environment. Rewarded ads are optional and must stay dim after the first refusal in Basic Launch. No submission package with placeholders should be prepared.
