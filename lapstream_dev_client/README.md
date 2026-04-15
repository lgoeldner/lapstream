# LapStream Dev Client (Coded by Gemini-CLI)

A terminal-based TUI (Text User Interface) client for testing the LapStream API during development.

## Features

- Device enrollment via OTP
- Role-based access control
- Admin OTP generation (with secure admin token prompt)
- Player management (reception role)
  - Register new players
  - List all players
  - View player details
- Lane assignment (lane_assign role)
  - Assign players to lane slots
  - Unassign players from lanes
  - View available players
- Admin bypass menu (admin role)
  - Role submenus for reception/lane_assign/lane_count access

## Setup

```bash
cd lapstream_dev_client
npm install
```

## Usage

Run in development mode:
```bash
npm run dev
```

If you want file watching (note: this can interfere with interactive TUI input), use:
```bash
npm run dev:watch
```

The client needs:
1. The LapStream server running (`npm run dev` in lapstream_server directory)
2. An admin token (in environment or prompted)
3. OTPs for device enrollment (generated via admin menu)

## Configuration

The client's default API URL is `http://localhost:3000`. To override:

```bash
API_BASE_URL=http://localhost:4000 npm run dev
```

Or use the environment variable:
```bash
export API_BASE_URL=http://localhost:4000
npm run dev
```

## Authentication Flow

1. From main menu, select "Generate OTPs (admin token required)"
2. Enter admin token (secure password input, not saved)
3. Specify device role and name
4. Receive OTPs for device enrollment
5. Enroll device using OTP
6. JWT token is stored in memory for subsequent API calls
7. Admin token is cleared from memory immediately after use

## Project Structure

```
src/
├── api/           # API client and endpoint wrappers
├── tui/           # Menu components and interactive prompts
├── config/        # Configuration management
├── types/         # TypeScript interfaces
└── index.ts       # Entry point
```

**Note for Future Enhancement:** The code is structured to support WebSocket integration for real-time data streaming when the server implements WebSocket endpoints. The architecture keeps REST API calls and WebSocket events separate in the module structure.
