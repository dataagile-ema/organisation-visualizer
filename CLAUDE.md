# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An organization visualization dashboard built with React, TypeScript, Vite, and Tailwind CSS. The app displays hierarchical organizational structure with financial, personnel, and operational metrics for each unit. Data is aggregated up the hierarchy tree automatically.

## Development Commands

### Main Visualizer App

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm preview
```

### Admin App (Organization Structure Editor)

The admin app is a separate application in `admin/` that provides a UI for editing `src/data/organization.json`.

```bash
# Install admin dependencies
cd admin && npm install
cd client && npm install

# Start admin app (backend + frontend)
cd admin && npm run dev
# Backend API: http://localhost:3001
# Frontend UI: http://localhost:5174

# Or start separately:
cd admin && npm run server    # Backend only
cd admin && npm run client    # Frontend only
```

**Important**: Changes made in the admin app write directly to `src/data/organization.json`. The main visualizer app (port 5173) requires a browser refresh (F5) to see changes.

## Architecture

### Data Flow

1. **Static JSON Data Sources** (`src/data/`):
   - `organization.json` - Hierarchical org structure with cost centers
   - `data.json` - Metrics keyed by cost center (leaf nodes only)
   - `accounts.json` - Account groups for financial categorization
   - `metrics-config.json` - Metric definitions and display configuration

2. **Data Aggregation** (`src/utils/aggregation.ts`):
   - Core function: `aggregateUnitData()` recursively aggregates data from child units to parents
   - Uses `getAllCostCenters()` to collect all leaf nodes under a unit
   - Economic data: Sums budget/utfall across all categories (intakter, personal, lokaler, material, externa, ovrigt)
   - Personnel data: Weighted averaging by antal_anstallda for percentages (personalomsattning, sjukfranvaro)
   - Production metrics: Sum for arenden, weighted average for kundnojdhet/kvalitetsindex/leveranstid

3. **State Management** (`src/hooks/useOrganization.ts`):
   - Single custom hook manages all app state
   - Loads all JSON data sources
   - Handles unit selection, tree expansion, breadcrumb navigation
   - Memoizes aggregated data to prevent unnecessary recalculations

4. **Component Structure**:
   - `App.tsx` - Root component using useOrganization hook
   - `AppLayout.tsx` - Two-column layout with sidebar and breadcrumbs
   - `OrgTree.tsx` + `OrgNode.tsx` - Recursive tree navigation in sidebar
   - `Dashboard.tsx` - Main metrics display for selected unit
   - Chart components (BudgetChart, CostBreakdownChart, etc.) - Recharts visualizations

### Key Type Definitions (`src/types/index.ts`)

- `OrgUnit` - Hierarchical structure with optional children array
- `UnitData` - Contains ekonomi, personal, produktion sections
- `EconomyData` - Account groups with budget/utfall, yearly/monthly values
- `MonthlyValue` - Structure with yearly total and monthly array[12]
- All metrics support monthly breakdown

### Data Aggregation Rules

When modifying aggregation logic in `src/utils/aggregation.ts`:

- **Sum aggregation**: Used for absolute values (costs, revenue, employee count, case volume)
- **Weighted average**: Used for percentages/ratios, weighted by antal_anstallda
- **Null handling**: Production metrics can be null; only aggregate when values exist
- **Leaf vs parent**: Leaf nodes (no children) use direct data from data.json; parent nodes aggregate from children

### UI Patterns

- Color coding by unit type: koncern (blue), division (emerald), avdelning (amber), stab (purple), enhet (slate)
- Variance indicators: positive (green), warning (yellow, <5%), negative (red, >=5%)
- Metric cards show both actual and budget with percentage variance
- Charts use Swedish month names from MONTH_NAMES constant
- All monetary values in KSEK (thousands of SEK)

## File Organization

- `/src/components/` - Organized by feature (Dashboard, Organization, Layout)
- `/src/data/` - All static JSON data files
- `/src/hooks/` - Custom React hooks
- `/src/utils/` - Pure functions for calculations
- `/src/types/` - TypeScript type definitions

## Admin App Architecture

The admin app (`admin/`) is a full-stack application for editing organizational structure:

### Backend (admin/server/)

**Express API** (Port 3001) with the following key services:

- **fileService.ts**: Atomic file operations for `organization.json`
  - Automatic backup creation before every write (stored in `backups/`)
  - Atomic write pattern: write to temp file → rename (OS-level atomic operation)
  - Rollback on failure
  - Cleanup keeps last 10 backups

- **validationService.ts**: Data integrity validation
  - Validates unique costCenter across entire tree
  - Validates unique IDs
  - Enforces hierarchy rules (e.g., stab must be under division)
  - Uses Zod schemas for input validation

**API Endpoints** (`routes/organization.ts`):
- `GET /api/organization` - Fetch entire tree
- `GET /api/organization/:id` - Fetch specific unit
- `POST /api/organization/:parentId/unit` - Create new unit
- `PUT /api/organization/:id` - Update unit
- `DELETE /api/organization/:id` - Delete unit
- `GET /api/organization/validate/cost-center/:cc` - Check availability
- `POST /api/organization/backup` - Create manual backup

### Frontend (admin/client/)

**React + Vite + TailwindCSS** (Port 5174):

- **OrgTreeEditor**: Collapsible tree view of organization with selection
- **OrgUnitForm**: Form for creating/editing units with real-time validation
- **useOrgData hook**: Manages API calls and local state
- **api service**: Type-safe HTTP client for backend communication

### Data Persistence Flow

```
Admin UI → API Request → Validation → Backup → Write to organization.json → Success
                              ↓ (on error)
                           Rollback from backup
```

The admin app and main visualizer app share `src/data/organization.json` but are otherwise completely independent. Changes require manual refresh in the main app.

## Common Patterns

When adding new metrics:
1. Add to data.json for each cost center
2. Update type definitions in src/types/index.ts
3. Add aggregation logic to src/utils/aggregation.ts
4. Create display component in src/components/Dashboard/
5. Add metric definition to metrics-config.json if needed

When modifying organization structure:
1. Use the admin app (http://localhost:5174) - do not manually edit organization.json
2. The admin app validates changes and creates automatic backups
3. Backups are stored in `backups/` directory
4. To restore: use the backup files (they are standard JSON)
