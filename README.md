# Ludo

A classic Ludo board game built with plain HTML, CSS, and vanilla JavaScript. No frameworks, libraries, or Canvas.

## Files

- `index.html` – page structure
- `style.css` – board, pieces, and responsive layout
- `script.js` – board generation and game logic

## How to Run

1. Put all three files in the same folder.
2. Open `index.html` in any modern browser.

No build step or server is needed.

## How to Play

1. Choose 2, 3, or 4 players (default is 4).
2. Click **Roll Dice** (or the die itself) on your turn.
3. Roll a **6** to bring a piece out of your home base onto your start cell.
4. Click a highlighted (pulsing) piece to move it. If only one move is possible, it plays automatically.
5. Move clockwise around the track, then up your colored home column into the center.
6. Finishing a piece needs an exact roll.
7. The first player to get all 4 pieces to the center wins.

## Rules Implemented

- **Turn order:** Red → Green → Yellow → Blue (clockwise).
- **Extra turn:** Rolling a 6, capturing an opponent, or reaching the center gives another roll.
- **Capturing:** Landing on an opponent's piece on the main track sends it back to its base.
- **Safe cells:** The four colored start cells and the four star cells cannot be captured on.
- **Home column:** Only your own pieces enter your colored column, so pieces there are always safe.
- **No valid move:** The turn passes automatically.

## Board Layout

The board is a 15×15 grid. The 52-cell track, the four 5-cell home columns, the base slots, and the center are all generated from the same coordinates, so the visuals and movement logic always match.

Piece positions are stored as:

| Value | Meaning |
|-------|---------|
| `-1` | In home base |
| `0–50` | On the main track (relative to the player's start cell) |
| `51–55` | In the colored home column |
| `56` | Finished (center) |

## Controls

- **Roll Dice** button or click the die to roll.
- **New Game** resets everything.
- **Players** selector changes the number of players and restarts the game.