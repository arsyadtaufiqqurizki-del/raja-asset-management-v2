# Developer Instructions

## Getting Started

Follow these steps to set up and run the application locally:

### 1. Install Dependencies
Run the following command to install all necessary packages:
```bash
npm install
```

### 2. Environment Configuration
The application connects to Firebase for backend services. You need to provide your Firebase configuration via environment variables. Add a `.env` file at the root of the project with the following properties:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
MIMO_API_KEY=your_xiaomi_mimo_api_key
```

### 3. Start Development Server
Run the local development server:
```bash
npm run dev
```
The server will typically start on port 3000.

### 4. Build for Production
To create a production-ready build:
```bash
npm run build
```

## Project Structure Overview
- `/src/components`: Contains reusable UI building blocks (e.g., `Layout.tsx`, `AiSidebar.tsx`, `AddMaintenanceModal.tsx`).
- `/src/pages`: Contains the main routable application views (`Dashboard.tsx`, `Inventory.tsx`, `Maintenance.tsx`).
- `/src/lib`: Contains utility functions (`utils.ts`) and global configurations (`firebase.ts`).
- `/src/context`: React Context providers for global state management (e.g., authentication state, asset contexts).
- `/server.ts`: The main Express backend server that proxies API requests, database queries, and secures calls to AI services like Xiaomi MiMo.
