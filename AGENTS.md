# Project Context & Guidelines

## Overview
This is a full-stack Asset Inventory & Maintenance Management application. It is designed to track corporate assets, their condition, maintenance schedules, and associated costs.

## Tech Stack
- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS
- **Backend**: Express API (`server.ts` compiled to `dist/server.cjs` via esbuild)
- **Database**: Cloud SQL (PostgreSQL) via Drizzle ORM
- **Authentication**: Firebase Authentication
- **Charting**: Recharts
- **AI Assistant**: Xiaomi MiMo (model `mimo-v2.5`), rendered with `react-markdown` and `remark-gfm`
- **Icons**: lucide-react

## Architecture & Data Flow
- **Client-Side**: The app uses `AssetContext` and `AuthContext` to manage global state. Components fetch data from the Express backend via REST API endpoints.
- **Server-Side**: The Express backend handles all database logic via endpoints (e.g., `/api/assets`, `/api/maintenance`).
- **AI Integration**: The Express backend exposes an `/api/ai/chat` endpoint that connects to `https://token-plan-sgp.xiaomimimo.com/v1/chat/completions`, passing the `MIMO_API_KEY`. The frontend uses `AiSidebar.tsx` to communicate with it.
- **Authentication**: The frontend retrieves a Firebase ID token (`auth.currentUser.getIdToken()`) and passes it in the `Authorization: Bearer <token>` header to the backend. The backend uses the `requireAuth` middleware to verify requests.
- **Database**: Schemas are declared in `src/db/schema.ts`. Ensure to update schemas only through Drizzle.

## Key Directories
- `src/components/`: Reusable UI components (modals, layouts, etc.).
- `src/context/`: React context providers for global state.
- `src/pages/`: Main application views (Dashboard, Inventory, Maintenance, Reports).
- `src/db/`: Drizzle ORM configuration and schema declarations.
- `src/lib/`: Core utilities and Firebase initialization.

## Rules & Development Guidelines for AI Agents
1. **Full-stack Execution**: Do not implement mock data. Always sync client features with real database endpoints mapped in `server.ts`.
2. **Database Schema**: Do not alter `schema.ts` without applying updates to the Cloud SQL database using the appropriate Drizzle DB tools.
3. **Authentication Boundary**: API requests must include the Firebase token. Backend routes should use `requireAuth` middleware to ensure endpoints are secure.
4. **Styling Constraints**: Utilize Tailwind CSS strictly. Do not introduce custom/inline CSS or generic component libraries unless specified. Use `cn()` from `src/lib/utils.ts` for dynamic class merging.
5. **Component Standards**: Only use functional components. Clean up side effects (`useEffect`) gracefully.
6. **Server Restarts**: If structural changes are made to `server.ts` or package configurations, make sure the dev server is restarted.

## Recent Data Format Adjustments & Schema (Phase 1-5 Implementation)
The application recently underwent a major restructuring of the `Asset` data model across the stack to align with accounting standards. 

**Comprehensive list of extended fields in `schema.ts` & `AssetContext.tsx`:**
- `assetBook` (string)
- `serialNumber` (string)
- `assetType` (string)
- `prorateConvention` (string)
- `assetUnits` (number, default: 1)
- `categorySegment1`, `categorySegment2` (Location), `categorySegment3` (string)
- `keySegment1`, `keySegment2`, `keySegment3` (string)
- `amortizationStartDate` (string)
- `depreciationMethod` (string)
- `lifeInMonths` (number)
- `costClearingAccount1` to `costClearingAccount8` (string)
- `listed` (string)
- `listedStatus` (string: 'Listed', 'Non-Listed', 'Audited', etc.)
- `assetNumber` (string, acts as unique identifier alongside `assetId`)
- `assetDescription` (string)
- `assetCost` (string / IDR Valuation)
- `datePlacedInService` (string)
- `lastUpdated` (timestamp)

**Important Notes for AI Agents:**
- **Data Mapping:** Ensure that any additions or updates to the asset inventory map correctly to these new fields in both the frontend (e.g., `AddAssetModal`, `ImportExcelModal`, `AssetContext.tsx`) and the backend Express server (`POST /api/assets`, `POST /api/assets/bulk`, `PUT /api/assets/:id`).
- **Table Rendering:** The `Dashboard.tsx` and `Inventory.tsx` pages rely on specific columns reflecting these new fields. Do not modify or remove these columns without user instruction.
- **Legacy Fields:** Some legacy fields (e.g., `id`, `name`, `val`, `date`) are still kept in the database and context for backward compatibility but are auto-synced/mapped from the new fields.
