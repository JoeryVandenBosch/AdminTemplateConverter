# Intune Policy Converter

## Overview

This is an **Intune Policy Converter** — a web application that helps IT administrators convert deprecated Microsoft Intune Administrative Template policies to the newer Settings Catalog format. The app connects to Microsoft Graph API to fetch existing policies, analyzes their settings, finds matching Settings Catalog definitions, and creates converted policies directly in the tenant.

The project follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
- `server/` — Express backend (API server)
- `shared/` — Shared types and schemas (used by both client and server)
- `migrations/` — Drizzle database migrations
- `script/` — Build scripts

### Frontend Architecture
- **Framework**: React with TypeScript
- **Bundler**: Vite (config in `vite.config.ts`)
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

The frontend is a single-page app with a Dashboard page as the main view. It uses a custom `ThemeProvider` for dark/light mode toggling with localStorage persistence.

### Backend Architecture
- **Framework**: Express 5 (running on Node.js via tsx)
- **Entry Point**: `server/index.ts`
- **API Pattern**: RESTful API routes prefixed with `/api/`
- **Key Modules**:
  - `server/routes.ts` — API route definitions (policy CRUD, conversion operations)
  - `server/graphClient.ts` — Microsoft Graph API client with OAuth2 client credentials flow and token caching
  - `server/storage.ts` — Storage interface (currently in-memory, prepared for database)
  - `server/vite.ts` — Vite dev server middleware for development
  - `server/static.ts` — Static file serving for production builds

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` (shared between client and server)
- **Database URL**: Configured via `DATABASE_URL` environment variable
- **Migrations**: Managed via `drizzle-kit push` (`npm run db:push`)

The storage layer currently uses an in-memory implementation (`MemStorage`), but the Drizzle configuration is set up for PostgreSQL. The schema file primarily contains TypeScript interfaces and Zod validation schemas for the Intune policy data model rather than database tables.

### Build System
- **Development**: `tsx server/index.ts` with Vite dev middleware for HMR
- **Production Build**: Custom build script (`script/build.ts`) that:
  - Builds the client with Vite (output to `dist/public/`)
  - Bundles the server with esbuild (output to `dist/index.cjs`)
  - Selectively bundles server dependencies from an allowlist to optimize cold start times
- **Production Start**: `node dist/index.cjs`

### API Endpoints
- `GET /api/tenant-info` — Fetch connected Azure tenant information
- `GET /api/policies` — List all Administrative Template policies
- `GET /api/policies/:id/settings` — Get settings for a specific policy
- `GET /api/policies/:id/assignments` — Get assignments for a specific policy
- `POST /api/policies/:id/assignments/resolve` — Resolve assignments with group display names
- `GET /api/groups/search?q=query` — Search Azure AD groups by name (requires Group.Read.All)
- `GET /api/filters` — List all Intune assignment filters in the tenant
- `DELETE /api/policies/:id/assignments` — Delete all assignments from a policy
- `POST /api/settings-catalog/:id/assignments` — Add/replace assignments on a Settings Catalog policy
- `POST /api/policies/:id/preview-conversion` — Preview which settings will transfer successfully before converting
- `POST /api/policies/convert` — Convert a policy to Settings Catalog format (body: policyId, newName, newDescription, includeAssignments)
- `DELETE /api/policies/:id` — Permanently delete an Administrative Template policy
- `GET /api/scope-tags` — List all role scope tags in the tenant
- `POST /api/scope-tags` — Create a new role scope tag (body: displayName, description)
- `DELETE /api/scope-tags/:id` — Delete a role scope tag
- `POST /api/settings-catalog/:id/scope-tags` — Update scope tags on a Settings Catalog policy (body: roleScopeTagIds)

## External Dependencies

### Microsoft Graph API (Beta)
- **Purpose**: Core integration for reading Intune Administrative Template policies and creating Settings Catalog policies
- **Auth**: OAuth2 client credentials flow (app-only, no user interaction)
- **Required Environment Variables**:
  - `AZURE_TENANT_ID` — Azure AD tenant ID
  - `AZURE_CLIENT_ID` — Azure AD application (client) ID
  - `AZURE_CLIENT_SECRET` — Azure AD application client secret
- **Token Caching**: Access tokens are cached in memory with 60-second pre-expiry refresh
- **Base URL**: `https://graph.microsoft.com/beta`

### PostgreSQL Database
- **Required Environment Variable**: `DATABASE_URL`
- **Used for**: Persistent data storage via Drizzle ORM
- **Session Store**: `connect-pg-simple` is available for session persistence

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` / `drizzle-zod` — Database ORM and schema validation
- `zod` — Runtime type validation (shared schemas)
- `@tanstack/react-query` — Client-side data fetching and caching
- `wouter` — Client-side routing
- `lucide-react` — Icon library
- Radix UI primitives — Accessible UI component foundations
- `express-session` / `connect-pg-simple` — Session management (available but not actively used)