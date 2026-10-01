# Jupiter's Pest Control

A responsive operations dashboard for a fictional, cat-run household pest control company. Review room-by-pest activity, Oakland weather, treat revenue and inventory, and the two-cat payroll ledger with enjoyment ratings.

## Overview

Jupiter and Cleo patrol an open-window home through the seasons. The dashboard turns their sightings, vanquishes, naps, and treat pay into a playful field report inspired by Egyptian motifs and Art Deco graphics.

## Learning Objectives

- Compare sightings, vanquishes, and vanquish rates across rooms, species, months, and hours.
- Compare fictional patrol outcomes against observed Oakland weather and the upcoming forecast.
- Track synthetic treat revenue, payroll, naps, enjoyment ratings, and supply levels.

## Getting Started

Requires Node.js 20.19 or newer. Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

The weather widget uses Open-Meteo geocoding, forecast, and historical archive APIs and needs an internet connection. The generator uses observed Oakland weather for January 1 through the current local date; pest, payroll, enjoyment, and treat-revenue figures remain deterministic fictional data:

```sh
npm run data:generate
npm run build
```

The displayed kill-to-sighting percentage is a **vanquish rate**, not a measure of detection accuracy. Pest surge alerts compare the latest 14 patrols with the previous 14.

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
