# Frontend Architecture Notes

This document tracks the emerging structure for the Angular frontend as we move logic out of `src/app/app.ts`.

## Directory layout (work in progress)
```
src/app/
  core/
    models/              # Shared TypeScript interfaces
    services/
      api/               # API clients (axios-based for now)
  features/
    graph/
      services/          # Graph-specific helpers (Cytoscape, mapping)
```

### Key responsibilities
- **`core/models`**: Types for skills, relations, and category colors shared across features.
- **`core/services/api`**: API client layer. `TechTreeApiService` centralizes node/relation CRUD so components avoid inline axios calls.
- **`features/graph/services/graph-data.service.ts`**: Maps domain data into Cytoscape element definitions and centralizes category color generation.

### Migration guidelines
- Prefer adding new feature-specific helpers under `src/app/features/<feature>/` rather than expanding `app.ts`.
- Add shared data contracts to `core/models` and reference them instead of `any`.
- Route all HTTP calls through `TechTreeApiService` (or a sibling service) to keep components UI-focused.
- If you introduce new Cytoscape helpers or layout tweaks, colocate them under `features/graph/`.

### Next steps to continue the split
- Extract graph rendering into a dedicated `GraphViewComponent` that consumes `GraphDataService` output.
- Move table and editor forms into feature-scoped components with local state services.
- Convert axios usage in `TechTreeApiService` to Angular `HttpClient` once the app is bootstrapped with `HttpClientModule`.
