# LapStream

LapStream is a live event tracking platform for distance-based swim (and run) events. It will support on-site race operations with fast participant registration, lane/slot assignment, and live status views.

## Goal

Enable staff to track participant progress in real time, keep lane assignments organized, and provide compelling live data during an event.

## Target Workflow

1. Register participant at reception.
2. Assign participant to a pace group and lane slot.
3. Capture lap progress from lane/helper stations.
4. Stream updates to live dashboards and operations views.
5. Review/export event results and audit history.

## Current Implementation Scope

This repository currently contains the backend service (`/lapstream_server`) and project planning docs.

Backend flow:
- configure server within the `serverconfig.dev.json` (CONFIG_PATH env variable)
- Register players via `POST /player/register`
- Manage Player's slot assignments via `/slots/`
TODO:
- Connect and authenticate clients with permission management
- Establish bidirectional live event stream to receive lap count events from clients
- Add live dashboard views and data terminals for event participants

## Tech Stack

Planned platform architecture:

- Frontend: SvelteKit PWA
- Backend: Node, ExpressJS
- Database: PostgreSQL (`postgres:18-alpine` image)
- ORM: drizzle
- Realtime communication: WebSockets

Current implemented backend stack in this repo:

- Runtime: Node.js (>= 22)
- Language: TypeScript
- API framework: Express 5
- Validation: Zod
- Database: PostgreSQL
- ORM / SQL tooling: Drizzle ORM + Drizzle Kit
- DB driver: `pg`
- Logging: Pino + pino-http
- Local DB orchestration: Docker Compose (`postgres:18-alpine`)

## Repository Structure

- `/lapstream_server` - backend API, DB, migrations/tooling, OpenAPI specs (TODO)
- server routes are split into a controller layer and a service layer, no repository abstraction.

- `/lapstream_client` - frontend (TODO), mock client with CLI (TODO)
