# ⚓ Battleship

A single-player Battleship game built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **10x10 Grid System** — Standard Battleship grid labeled A-J / 1-10
- **5-Ship Fleet** — Carrier (5), Battleship (4), Destroyer (3), Submarine (3), Patrol Boat (2)
- **Setup Phase** — Place ships manually with horizontal/vertical toggle, or randomize placement
- **Battle Phase** — Alternating turns with hit/miss/sunk feedback
- **Smart AI** — Random targeting with hunt mode (targets adjacent cells after a hit)
- **Battle Log** — Real-time move history panel
- **Win/Loss Modal** — Clear endgame screen with restart option
- **Visual States** — Color-coded cells for empty, ship, hit, miss, and sunk

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
