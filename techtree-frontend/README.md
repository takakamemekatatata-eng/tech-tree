# TechTree Frontend

Angular + Cytoscape.js client for visualizing skill relationships.

## Prerequisites
- Node.js 20+
- npm

## Development server
```bash
npm install
ng serve
```

Open `http://localhost:4200/` (API defaults to `http://localhost:8000`).

## Testing
```bash
ng test
```

## Building
```bash
ng build
```

## Notes
- Architecture and folder layout: see [`docs/FRONTEND_ARCHITECTURE.md`](../docs/FRONTEND_ARCHITECTURE.md).
- Styling variables live in `src/app/style-variables.css`; graph visual config in `src/app/visual-config.ts`.
