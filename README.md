# Battleship Bingo

Battleship-themed bingo for group events. Bingo cards are small naval grids: each
ship cell carries a number, the caller reads numbers out, and players strike off
their fleet. Win tiers:

1. **First ship** — first player to sink any one ship (usually the Frigate).
2. **First of each type** — a prize per ship type (Frigate, Submarine, Destroyer, Battleship, Carrier).
3. **All clear** — full house, all 17 cells.

## The two halves

- **Printable cards** (home) — generate a reproducible pack and download it as a
  print-ready PDF. Two styles (**Sonar** schematic / **Recon** illustrated, with
  top-down warship sprites) × **Day/Night**, chosen site-wide in the top bar; the
  same setting drives the PDF (which always prints on white).
- **Interactive game** — entirely client-side, no server:
  - **Play** (`?v=play` → `?card=CODE`): open a card, tap squares to daub as
    numbers are called, with live win detection and a shoutable card code.
  - **Caller** (`?v=call`): draw numbers (deterministic per game, so undo→call is
    stable), hand out a **Play Link**, **issue** tracked cards, and **check a
    claim** by typing the shouted code — every tracked card updates live against
    the called numbers, and a card flashes when the latest call sinks one of its
    ships.

## How it works

A card is a pure function of a short **Crockford-base32 code** (plus the fixed
grid/pool). The code seeds a deterministic PRNG that places the fleet and assigns
numbers, so the same code always yields the same card on any machine. That's what
makes packs reproducible **and** lets the code double as the verification token —
the caller regenerates any player's card (printed or digital) from its code and
checks it against the numbers called so far. No database required.

Generation meets the bingo "minimum bar": distinct numbers within each card,
every card in a pack distinct, balanced number distribution, fully reproducible.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
```

`base: './'` plus links built from `window.location` at runtime (`src/lib/url.ts`)
mean the app runs unchanged on localhost, a GitHub Pages project path, or a custom
domain. Routing is via query params (`?card`, `?v=play`, `?v=call`), so no SPA
fallback is needed on static hosting.

## Not yet (post-v1)

- **Prize tracker** — the caller adjudicates first-ship / first-of-each-type /
  all-clear from the live per-card status; a panel that records *who claimed which
  prize* is the planned next step.
- **More mobile testing** — the interactive views are responsive but want real
  device passes (phones in hand, various sizes) before leaning on them at an event.

## Stack & credits

Vite + React + TypeScript. PDF via `jsPDF` + `svg2pdf.js` (cards render as SVG).
QR codes via `qrcode`. Recon ship sprites: the
[“Sea Warfare Set” by Lowder2](https://opengameart.org/content/sea-warfare-set-ships-and-more)
(CC0).
