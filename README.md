# Peninsula Party 2026 Planner

Route planning tool for the [BMW Motorcycles of Grand Rapids Peninsula Party 2026](https://www.bmwmcgr.com/event/peninsula-party-2026/) season-long ferry rally.

## Features

- All 16 ferry sites with every individual checkpoint (mainland docks, island docks, on-the-water points)
- Build multiple trips (e.g. one per weekend) — pick checkpoints, drag to reorder
- Running point total across all saved trips, always visible
- Map view with stop pins and a driving route through the active trip
- Configurable home base (defaults to BMW Motorcycles of Grand Rapids)
- Everything saved to `localStorage` — your trips persist between visits
- Optional shareable link of the active trip

## Stack

- Vite + React + TypeScript
- Leaflet + OpenStreetMap tiles (no API key)
- OpenRouteService for driving routes (free key — sign up at [openrouteservice.org/dev/#/signup](https://openrouteservice.org/dev/#/signup))
- @dnd-kit for drag-to-reorder
- Deployed to GitHub Pages

## Local Development

```bash
npm install
npm run dev
```

Open Settings (top right) and paste your OpenRouteService API key.

## Deploy

Push to `main` and the GitHub Actions workflow builds and publishes to GitHub Pages.

Live site: <https://masonkuck.github.io/PeninsulaPartyPlanner>
