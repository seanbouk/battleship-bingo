# Battleship Bingo

Battleship-themed bingo for group events. Bingo cards are small naval grids: each
ship cell carries a number, the caller reads numbers out, and players strike off
their fleet. Win tiers:

1. **First ship** — first player to sink any one ship (usually the Frigate).
2. **First of each type** — a prize per ship type (Frigate, Submarine, Destroyer, Battleship, Carrier).
3. **All clear** — full house, all 17 cells.

## Status

- **Phase 1 — card generator (in progress):** generate a reproducible pack of
  cards and download them as a print-ready PDF. Two styles (**Sonar** schematic /
  **Recon** illustrated) × **Day/Night**, chosen site-wide in the top bar — the
  same setting drives the PDF.
- **Phase 2 — interactive caller (planned):** share a card by link/QR; a card's
  short code is its verification token, so the caller can reconstruct and check
  any player's card. No server required.

## How it works

A card is a pure function of a short **code** plus `(grid, pool)`. The code seeds
a deterministic PRNG that places the fleet and assigns numbers, so the same code
always yields the same card on any machine — which is what makes packs
reproducible and (later) makes the code usable as a verification token.

Generation meets the bingo "minimum bar": distinct numbers within each card,
every card in a pack distinct, balanced number distribution, fully reproducible.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
```

The app uses `base: './'` and builds every shareable link from `window.location`
at runtime (`src/lib/url.ts`), so it runs unchanged on localhost, on a GitHub
Pages project path, or behind a custom domain.

## Stack

Vite + React + TypeScript. PDF via `jsPDF` + `svg2pdf.js` (cards render as SVG,
vectorised into the PDF). Ship art (Recon style) will come from
[game-icons.net](https://game-icons.net) under CC BY 3.0.
