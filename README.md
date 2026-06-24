# Asset Management Dashboard

A modern web application for managing company assets, tracking inventory, and scheduling maintenance. 

## Features
- **Dashboard**: High-level overview of assets, values, and trends using interactive charts.
- **Inventory**: Detailed spreadsheet-like list of all assets with their current status, category, and monetary value.
- **Maintenance Tracking**: Log routine inspections and emergency repairs, complete with a built-in interactive calendar view.
- **MiMo AI Assistant**: Smart conversation sidebar powered by Xiaomi MiMo (`mimo-v2.5`) to answer context-aware questions about company assets, inventory counts, and values correctly formatted in markdown and tables.
- **Cloud SQL & Firebase**: Secure authentication via Firebase, coupled with a full robust Cloud SQL (PostgreSQL) relational database via Drizzle ORM.
- **Responsive Layout**: Works seamlessly across desktop and mobile views.

## Tech Stack
- Frontend Framework: React 18 with TypeScript
- Build Tool: Vite
- Markdown: `react-markdown` with `remark-gfm`
- Styling: Tailwind CSS
- Icons: Lucide React
- Charts/Visualizations: Recharts
- Backend/Platform: Express Server, Cloud SQL (PostgreSQL), Firebase Auth, Xiaomi MiMo AI API
