# LapStream

LapStream is an event operations platform for lane/slot based races.  
The current repo includes a working backend (`lapstream_server`) and a working terminal dev client (`lapstream_dev_client`).

## Current Status

Implemented today:
- Server-side authentication and authorization
  - Admin-protected OTP generation
  - Device enrollment via OTP
  - JWT access tokens + refresh token rotation
  - Role guards on protected endpoints
- Player management API (reception role)
- Lane assignment API (lane_assign role)
- Dev TUI client for enrollment, OTP generation, player registration, and lane assignment
- Integration test covering auth + player + lane flows

Not implemented yet:
- Lane count workflow/menu
- Realtime lap event streaming and dashboards

## Auth Model

1. Admin generates one-time OTPs with role + device name (`POST /auth/admin/otp`).
2. Device enrolls with OTP (`POST /auth/device`) and receives:
   - short-lived JWT
   - refresh token
3. Protected routes require a valid JWT with matching role (`admin` bypasses role checks).
4. Dev client auto-refreshes expired JWTs through `POST /auth/refresh` and persists updated credentials.

Roles:
- `admin`
- `reception`
- `lane_assign`
- `lane_count` (reserved; menu not implemented yet)

## Quick Start (Local)

Prerequisites:
- Node.js 22+
- Docker

1. Start Postgres:
```bash
cd lapstream_server
docker compose up -d
```

2. Configure server env:
```bash
cp .env.example .env
```

Set required values in `lapstream_server/.env`:
- `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/lapstream`
- `CONFIG_PATH=../serverconfig.dev.json`
- `ADMIN_API_TOKEN=<your-admin-token>`
- `JWT_SECRET=<base64-secret>`
- `REFRESH_TOKEN_PEPPER=<base64-secret>`

3. Install and prepare DB schema:
```bash
npm install
npm run drizzle:migrate
```

4. Run server:
```bash
npm run dev
```

5. In a second terminal, run the dev client:
```bash
cd lapstream_dev_client
npm install
npm run dev
```

The dev client default API is `http://localhost:4000`. Override via `API_BASE_URL` if needed.

## API Snapshot

- Public:
  - `GET /`
  - `GET /lane/pace-groups`
- Auth:
  - `POST /auth/admin/otp` (requires `Authorization: Bearer <ADMIN_API_TOKEN>`)
  - `POST /auth/device`
  - `POST /auth/refresh`
- Reception:
  - `POST /player`
  - `GET /player`
  - `GET /player/:id`
- Lane assign:
  - `PUT /lane/:paceGroup/:position/player`
  - `DELETE /lane/:paceGroup/:position/player`

## Repository Structure

- `lapstream_server`: Express + TypeScript API, Drizzle schema/migrations, integration tests
- `lapstream_dev_client`: Interactive terminal client for OTP/auth and role-based workflows
- `lapstream_client`: Tauri client scaffold (not part of current tested workflow)
