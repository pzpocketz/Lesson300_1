# Jupiter's Pest Control

A responsive operations dashboard for a fictional, cat-run household pest control company. Review room and pest activity, weather, treat inventory, and the two-cat payroll ledger.

## Overview

Jupiter and Cleo patrol an open-window home through the seasons. The dashboard turns their sightings, vanquishes, naps, and treat pay into a playful field report inspired by Egyptian motifs and Art Deco graphics.

## Learning Objectives

- Compare pest sightings and vanquishes across rooms, species, months, and hours.
- Explore how seasonal weather and open windows relate to pest activity.
- Track team shifts, treat pay, naps, and supply levels.

## Getting Started

Requires Node.js 20.19 or newer. Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

The current-conditions panel uses the Open-Meteo geocoding and forecast APIs and needs an internet connection. The historical 2025 field ledger is fictional and reproducible:

```sh
npm run data:generate
npm run build
```

## Project Structure

```text
Jupiter's Pest Control/
├── scripts/generate-metrics.mjs
├── src/
│   ├── data/metrics.json
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── package.json
├── README.md
└── PLAN.md
```

## Progress

See [PLAN.md](PLAN.md) for goals, milestones, and completion criteria.
