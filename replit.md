# Minha Turma - Class Grade Management App

## Overview
A full-stack web application for managing classroom grades, student rankings, and activities. Built with React (frontend) and Express.js (backend), with in-memory data storage.

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js 5, TypeScript, tsx (runtime)
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Export**: jsPDF (PDF export), xlsx (Excel import/export)

### Project Structure
```
client/          # React frontend
  src/
    components/  # UI components
    hooks/       # Custom React hooks
    lib/         # Utility functions
    pages/       # Page components
server/          # Express.js backend
  index.ts       # Server entry point
  routes.ts      # API routes
  storage.ts     # In-memory data storage
  static.ts      # Static file serving
  vite.ts        # Vite dev middleware
shared/          # Shared types/schema
  routes.ts      # Shared route types
  schema.ts      # Data schemas
script/          # Build scripts
```

### Key Features
- Student grade management and tracking
- Class ranking system with position display
- Activity creation and management
- Excel import/export for grades
- PDF export for reports
- Top 10 performance chart
- Student link sharing

## Running the Project
- **Dev**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Start (prod)**: `npm run start`

## Ports
- Port 5000 is the only open port, serving both the API (`/api/*`) and the React frontend
