# LapStream Server

Express + TypeScript server with `pg` and Drizzle ORM prepared.

## What is included
- Express app bootstrap with typed env config (`zod` + `dotenv`).
- Database client setup using `pg` pool.
- Drizzle setup (`drizzle-orm` + `drizzle-kit`) with initial schema file.
- Health endpoints:
  - `GET /`
  - `GET /health`
  - `GET /health/db`

## Setup steps
1. Copy env file:
```bash
cp .env.example .env
```
2. Install dependencies:
```bash
npm install
```
3. Start dev server:
```bash
npm run dev
```
4. Type-check:
```bash
npm run type-check
```
5. Build production bundle:
```bash
npm run build
```

## Drizzle commands (prepared)
- Generate SQL migration files from schema:
```bash
npm run drizzle:generate
```
- Run generated migrations:
```bash
npm run drizzle:migrate
```

No DB container is added in this step.
