# Battleship

A polished single-player Battleship game built with React, TypeScript, Vite, and Tailwind CSS. Play against a smart AI opponent with hunt-and-target strategy.

## Features

- **10x10 Grid System** — Standard Battleship grid labeled A-J / 1-10
- **5-Ship Fleet** — Carrier (5), Battleship (4), Destroyer (3), Submarine (3), Patrol Boat (2)
- **Setup Phase** — Place ships manually with horizontal/vertical toggle, or randomize placement
- **Battle Phase** — Turn-based gameplay with hit/miss/sunk visual feedback
- **Smart AI** — Hunt-and-Target state machine with checkerboard parity pattern for efficient searching
- **Toast Notifications** — Real-time alerts when ships are sunk
- **Battle Log** — Timestamped move history panel
- **Win/Loss Modal** — Clean endgame overlay with restart option
- **Responsive Design** — Works on desktop and mobile
- **Visual Polish** — Gradient backgrounds, smooth animations, hover effects

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

## AI Strategy

The AI uses a Hunt-and-Target state machine:
- **Hunt Mode**: Fires using a checkerboard parity pattern (since all ships are at least 2 spaces, they must occupy at least one parity cell)
- **Target Mode**: Once a hit is scored, targets adjacent cells and follows the ship's axis until it's sunk
- **Queue Rebuilding**: When a ship sinks, remaining unsunk hits rebuild the target queue for multi-ship scenarios
