# CLAUDE.md

## Project Overview

Organisation Visualizer - React dashboard för hierarkisk organisationsstruktur med finansiella och operativa metrics. All data laddas från statiska JSON-filer.

## Kommandon

```bash
npm run dev          # Visualizer på http://localhost:5173
cd admin && npm run dev   # Admin-app (backend :3001, frontend :5174)
```

## Admin-appen

Separat app i `admin/` för att redigera `src/data/organization.json`.

- **Backend**: Express API med automatiska backups (sparas i `backups/`)
- **Frontend**: React UI för att skapa/redigera/ta bort enheter
- **OBS**: Visualiseraren kräver F5 för att se ändringar från admin

## Arkitektur

```
src/data/*.json → useOrganization hook → Components
```

- `organization.json` - Hierarkisk orgstruktur
- `data.json` - Metrics per kostnadsställe
- `src/utils/aggregation.ts` - Aggregerar data uppåt i trädet
- `src/hooks/useOrganization.ts` - Central state management

## Enhetstyper

koncern (blå), division (grön), avdelning (gul), stab (lila), enhet (grå)
