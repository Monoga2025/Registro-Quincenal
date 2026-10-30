# Registro Quincenal (Employee Attendance and Biweekly Payroll)

A web app for employee check-ins and biweekly hour reports, built as a pnpm monorepo with an Express API and a React front end.

## Why
Small teams often track attendance on paper or spreadsheets and rebuild biweekly totals by hand. This app records check-ins and produces per-employee and per-period summaries, with a configurable hourly rate.

## Key features
- Employee CRUD and login (`/employees-public`, `/quick-login`, `/login`, `/me`)
- Check-ins and today/history views (`/checkin`, `/today`, `/history`)
- Biweekly reports for admins and employees (`/biweekly`, `/my-biweekly`)
- Hourly-rate settings (`/hourly-rate`)
- Hold-to-register check-in control in the UI

## Stack
TypeScript, Express, Drizzle ORM, React, Vite, shadcn/ui components, an OpenAPI spec with generated clients and Zod schemas.

## Structure
```
artifacts/api-server/       Express API (routes, auth middleware)
artifacts/employee-tracker/ React + Vite front end
lib/db/                     Drizzle schema and database layer
lib/api-spec/               OpenAPI spec and codegen config
lib/api-zod/, lib/api-client-react/  Generated shared packages
scripts/                    Workspace helper scripts
```

## How to run
```bash
pnpm install        # npm/yarn are blocked by the preinstall hook
pnpm run build      # typecheck + build all artifacts
cd artifacts/api-server && pnpm dev
cd artifacts/employee-tracker && pnpm dev
```
A PostgreSQL database and environment variables are needed; check `lib/db` before running.

## Status
Functional code base. No automated test suite was found. The project was scaffolded on Replit (`.replit` files are still present).

Built by Monoga (https://github.com/Monoga2025)
