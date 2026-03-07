# MaatWork CRM - Agent Instructions

This file contains essential context, commands, and code style guidelines for AI agents operating in the MaatWork CRM repository.

## 🏗️ Project Overview & Stack

MaatWork CRM is a monorepo (Turborepo + pnpm workspaces) built for financial advisors.
The main application is located in `apps/web/`.

**Core Stack:**
- **Framework:** TanStack Start (SSR + SPA)
- **Routing:** TanStack Router (file-based, type-safe)
- **State Management:** TanStack Query (server state)
- **Auth:** better-auth
- **Database & ORM:** PostgreSQL (Neon) + Drizzle ORM
- **Background Jobs:** Inngest
- **Styling:** Tailwind CSS v4 + Radix UI + Framer Motion
- **Tooling:** Vite, Biome (Lint/Format), Vitest, Playwright

---

## 🚀 Build, Lint, and Test Commands

Always run commands from the root directory using `pnpm` or `turbo`, or navigate to `apps/web` for specific app commands.

### Development & Build
- **Start Dev Server:** `pnpm dev` (runs `turbo dev`, accessible at http://localhost:3000)
- **Build for Production:** `pnpm build`
- **Start Production:** `pnpm --filter web start`

### Linting & Formatting (Biome)
The project uses **Biome** instead of ESLint/Prettier.
- **Check Lint/Format:** `pnpm lint`
- **Auto-fix Lint/Format:** `pnpm --filter web lint:fix`

### Testing
- **Run All Unit Tests:** `pnpm test`
- **Run Unit Tests in Watch Mode:** `pnpm --filter web test:watch`
- **Run a Single Test File:** `pnpm --filter web test run <path-to-file>` (e.g., `pnpm --filter web test run tests/auth.test.ts`)
- **Run E2E Tests (Playwright):** `pnpm test:e2e`

### Database (Drizzle)
- **Generate Migrations:** `pnpm --filter web db:generate`
- **Push Schema to DB:** `pnpm --filter web db:push`
- **Run Migrations:** `pnpm --filter web db:migrate`
- **Seed Database:** `pnpm --filter web db:seed`
- **Open Drizzle Studio:** `pnpm --filter web db:studio`

---

## 🎨 Code Style & Guidelines

### 1. Formatting & Linting (Biome Rules)
- **Indentation:** 2 spaces.
- **Line Width:** 120 characters.
- **Quotes:** Double quotes (`"quoteStyle": "double"`).
- **Semicolons:** Always (`"semicolons": "always"`).
- **Trailing Commas:** All (`"trailingCommas": "all"`).
- **Imports:** Automatically organized by Biome (`"organizeImports": { "enabled": true }`). Do not manually over-engineer import sorting; let Biome handle it.

### 2. TypeScript & Typing
- **Strict Mode:** TypeScript is configured with `"strict": true`.
- **No `any`:** Avoid using `any`. Define proper interfaces or use `unknown` if the type is truly dynamic.
- **Validation:** Use **Zod** (`zod`) for all schema validations (API inputs, form data, environment variables).
- **Type Inference:** Leverage Drizzle's type inference for database models and TanStack Router's type-safe routing.

### 3. Naming Conventions
- **Components:** `PascalCase` (e.g., `ContactCard.tsx`).
- **Functions/Variables:** `camelCase` (e.g., `fetchContacts`, `userData`).
- **Constants:** `UPPER_SNAKE_CASE` for global constants (e.g., `MAX_UPLOAD_SIZE`).
- **Files/Directories:** 
  - General files: `kebab-case` (e.g., `utils/date-helpers.ts`).
  - Routes: Follow TanStack Router file-based routing conventions (e.g., `__root.tsx`, `_app.tsx`, `_app/dashboard.tsx`).

### 4. React & UI Components
- **Functional Components:** Use functional components with hooks.
- **Styling:** Use Tailwind CSS v4 utility classes.
- **Class Merging:** Use the `cn` utility (combining `clsx` and `tailwind-merge`) for conditional classes.
  ```tsx
  import { cn } from "@/lib/utils";
  <div className={cn("base-class", isActive && "active-class")} />
  ```
- **UI Library:** Use Radix UI primitives for accessible components. Do not build complex accessible components (like Dialogs, Selects, Dropdowns) from scratch.

### 5. State Management & Data Fetching
- **Server State:** Use **TanStack Query** (`useQuery`, `useMutation`) for all asynchronous data fetching and caching.
- **Local State:** Use React's `useState` or `useReducer` for purely local UI state.
- **Form State:** Integrate forms with Zod validation.

### 6. Error Handling
- **API/Server Functions:** Wrap database calls and external API requests in `try/catch` blocks.
- **Logging:** Use `pino` for server-side logging. Do not leave `console.log` in production code.
- **User Feedback:** Use the Radix UI Toast component to display success/error messages to the user.
- **Validation Errors:** Return structured Zod errors to the client.

### 7. Database & ORM (Drizzle)
- **Schema:** Define schemas in `apps/web/server/db/schema/`.
- **Queries:** Use Drizzle's query builder. Prefer relational queries (`db.query.tableName.findMany`) for complex joins when possible, or standard SQL-like syntax for performance-critical operations.
- **Migrations:** Always generate and push/migrate schema changes when modifying tables.

### 8. Background Jobs (Inngest)
- Place Inngest functions in `apps/web/server/inngest/`.
- Use event-driven architecture for tasks like sending emails, processing large exports, or cron jobs (e.g., `onTaskOverdue`).

---
*Note: When implementing features, always verify your changes by running `pnpm lint` and `pnpm test` before considering the task complete.*