# LapStream Concept

## 1. Goal
LapStream is a live event tracking platform for swim (and run) events where performance is measured by laps/rounds and captured in real time.

Core flow:
1. Register participant and assign personal bib number.
2. Assign pace/performance group (color + group number).
3. Assign participant to lane/track slot.
4. Lane helper records each completed lap via single click.
5. Live dashboards show rankings and participant stats with filters and custom views.

## 2. Product Scope and Value
- Multi-role workflows: reception, grouping desk, lane helper, dashboard viewers, admin.
- Real-time data flow: low-latency updates for operations and public leaderboard.
- Analytics logic: distance, splits, rankings by category/group.
- Custom dashboards: saved filters, widget layouts, query-based views.

## 3. Roles and User Journeys
### Reception Terminal
- Create participant profile and registration.
- Generate bib number and optional QR code.
- Quick search and same-day registration list.

### Grouping Desk
- Find participant by bib/QR/name.
- Assign pace group and lane.
- Show lane capacity and occupancy before assignment.

### Lane Helper Station
- Single-lane full-screen tablet view.
- Large participant cards for fast click capture.
- One click = one immutable lap event.
- 5-second undo window for the last helper action.

### Dashboard Users
- Public leaderboard for top performers.
- Operations dashboard for lane occupancy and helper/device activity.
- Analytics dashboard with filters (age, gender, team, pace group, lane, time).
- Participant detail page with event timeline and splits.

### Admin
- Configure events, lanes, groups, age categories.
- Manage users, roles, devices, permissions.
- Export data and review audit logs.

## 4. Domain Model
Primary entities:
- `Event`: name, location, date, sport type, lap/lane length, start time, status.
- `Participant`: demographic and team metadata.
- `Registration`: bib number, registration timestamp, check-in status.
- `PaceGroup`: color, label, pace range/level.
- `Lane`: lane number, capacity, status, assigned helper device.
- `LaneAssignment`: participant + lane + pace group + active time window.
- `LapEvent`: immutable lap record with participant, lane, timestamp, helper, source device, sequence.
- `MetricsSnapshot` (optional): pre-aggregated stats for high-throughput dashboards.
- `DashboardLayout` (optional): JSON layout + saved query/filter definitions.

## 5. Data and Event Principles
### Event-sourcing light
- `LapEvent` records are append-only and never mutated.
- Derived stats (distance, rank, splits) are computed from events.
- Benefits: auditability, replayability, resilience to UI errors.

### Validation and consistency
- Reject lap events if participant is not actively assigned to that lane.
- Use optimistic ordering (sequence + timestamp) and DB constraints to avoid duplicate/conflicting counts.
- Support helper-local undo only for a short controlled window.

## 6. Core Metrics and Ranking
### Distance
- Swim: `distance = laps * laneLength`.
- Run: `distance = laps * lapLength`.

### Timing and pace
- If timestamps are captured per lap event, compute splits and pace.
- If precise timing is unavailable, expose activity metrics (laps per period).

### Ranking
- Primary ranking: total distance desc.
- Tie-breaker: earlier last lap timestamp wins (configurable).
- Secondary views: by age class, pace group, team.

## 7. Architecture (Recommended)
## Runtime model
- Central server in local network (LAN-first).
- PWA clients (Svelte) for all stations.
- Real-time delivery via WebSockets.

### Stack
- Frontend: `SvelteKit` + PWA plugin.
- Backend: `NestJS` with `Fastify` adapter.
- Database: `PostgreSQL`.
- ORM: `Prisma`.
- Optional: `Redis` for pub/sub and horizontal scale.

### Why this stack for this use case
- Strong modularity for role-based workflows and permissions.
- Good real-time support for high-frequency lap-click streams.
- Type-safe full stack with shared DTO/schema contracts.
- Container-friendly deployment with clear local-network operation.

## 8. Containerization Strategy
Development recommendation:
- Containerize `PostgreSQL` (and optional `Redis`) always.
- Run API and web app natively for faster hot reload/debug.
- Keep an optional full-container dev profile for onboarding/parity.

Production/LAN deployment:
- Containers for `api`, `web`, `postgres`, optional `redis`, optional reverse proxy.
- Static service discovery via Docker network.
- Persistent DB volume and scheduled backups.

## 9. Non-functional Requirements
- Low-latency writes and fan-out updates in LAN.
- Offline tolerance for helper stations (short buffered queue, sync when online).
- Full audit trail for all critical actions.
- Role-based access control and session/device management.
- Observability: event ingestion rate, failed validations, device offline alerts.

## 10. Milestone Plan
1. Foundation: auth, roles, event/participant CRUD, registration flow.
2. Operations: grouping desk, lane assignment, helper lap capture + undo.
3. Live views: leaderboard + operations dashboard via WebSockets.
4. Analytics: filters, participant detail, age-class rankings.
5. Custom dashboards: saved layouts and query presets.
6. Hardening: audit log, exports, load testing, offline handling.
