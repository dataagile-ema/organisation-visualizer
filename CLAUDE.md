# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Organisation Visualizer is a React-based organizational dashboard for viewing hierarchical organizational structures with financial and operational metrics. All data is loaded from static JSON files (no backend).

## Development Commands

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture

### Data Flow
```
JSON files (src/data/) → useOrganization hook → Components
```

The app is entirely data-driven. Organization hierarchy, accounts, metrics config, and monthly data are all stored in JSON files under `src/data/`.

### Key Files

- **`src/hooks/useOrganization.ts`** - Central state management hook. Manages selected unit, expanded tree nodes, and provides aggregated data.
- **`src/utils/aggregation.ts`** - Data aggregation logic. Recursively aggregates child unit data with proper handling for weighted averages (percentages) vs. sums (financial values).
- **`src/types/index.ts`** - All TypeScript interfaces including `OrgUnit`, `UnitData`, `MonthlyValue`.

### Component Structure

```
App.tsx
├── AppLayout (header, sidebar, breadcrumbs)
│   ├── OrgTree → OrgNode (recursive tree navigation)
│   └── Dashboard
│       ├── MetricCard (reusable metric display)
│       ├── BudgetChart (Recharts BarChart)
│       ├── CostBreakdownChart
│       └── ChildUnitsComparison
```

### Organization Types
Units have types: `koncern`, `division`, `avdelning`, `enhet`, `stab` - each with distinct colors in the UI.

## Data Structure

**Organization JSON** (`src/data/organization.json`): Hierarchical tree of units with id, name, type, costCenter, manager, children.

**Data JSON** (`src/data/data.json`): Keyed by cost center. Each entry contains:
- `ekonomi`: Account groups (intäkter, personal, lokaler, material, externa, ovrigt) with budget/utfall
- `personal`: antal_anstallda, personalomsattning %, sjukfranvaro %
- `produktion`: arenden, leveranstid, kundnojdhet %, kvalitetsindex %

**MonthlyValue format**: `{ yearly: number, monthly: number[12] }`

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 7 (build tool)
- Tailwind CSS 4.1
- Recharts (charts)
- Lucide React (icons)

## Localization

The app uses Swedish throughout: month names, number formatting (`sv-SE`), labels, and organizational terminology.
