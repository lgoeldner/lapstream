# State Management — lapstream client

## Overview

All shared state lives in a single **zustand store** (`src/stores/authStore.ts`).  
Local, ephemeral UI state (form inputs, dialog open/close) stays in `useState` inside the component that owns it — no need to hoist it.

---

## The Auth Store (`useAuthStore`)

```
src/stores/authStore.ts
```

### Shape

```ts
type AuthState = {
  config: Config | null;         // null = logged out / unauthenticated
  login:  (data: ClientData) => void;
  logout: () => void;
  refreshCreds: () => Promise<void>;
};
```

### `Config` vs `ClientData`

Both types live in `src/lib/config_provider.ts`.

| Field | `ClientData` | `Config` |
|---|---|---|
| credentials.jwt | `string` (always present) | `string \| null` (null when persisted to disk) |
| everything else | identical | identical |

`ClientData` is what the server returns on login.  
`Config` is what we keep in memory and on disk (JWT stripped from disk, kept in `sessionStorage`).

### Persistence strategy

| What | Where | Why |
|---|---|---|
| Config (no JWT) | `localStorage` | survives app restart |
| JWT | `sessionStorage` | cleared on browser close — intentional security boundary |
| Refresh token | `sessionStorage` (inside config) | same |

On startup the store self-hydrates by calling `getStoredConfig()` during store creation — no `useEffect` needed anywhere.

---

## JWT Refresh Flow

`refreshCreds()` is designed to be called freely before any authenticated request.  
It is **idempotent**: if the JWT is still valid it returns immediately.

```
caller (e.g. ReceptionApi.registerPlayer)
  │
  ▼
refreshCreds()
  ├─ JWT still valid? → return (noop)
  ├─ Refresh already in-flight? → return existing promise (deduplication)
  └─ POST /auth/refresh { refresh_token }
       ├─ ok  → update Config in store + sessionStorage → return
       └─ err → toast "Session expired" → logout() → throw
                    │
                    ▼
               App sees config === null → renders <LoginDialog>
```

The in-flight deduplication uses a module-level `Promise | null` variable — not part of the zustand state — so concurrent callers coalesce onto a single network request without extra re-renders.

---

## API Layer (`src/lib/api_access.ts`)

### `useApi()` hook

```ts
const api = useApi();
// api.reception.registerPlayer(name, age)
```

Subscribes to the auth store and returns an `Api` instance. Re-creates the instance whenever the store changes (login/logout/refresh).

### Authenticated request pattern (`ReceptionApi`)

```ts
async registerPlayer(name, age) {
  await this.refreshCreds();                          // ensure JWT is fresh
  const config = useAuthStore.getState().config!;    // always read AFTER refresh
  // fetch with config.credentials.jwt
}
```

Reading config via `getState()` (not a hook) after the refresh guarantees we use the **new** JWT, not the snapshot captured at `useApi()` call time. This fixes a bug that existed in the old implementation.

---

## Routing

Routing is a derived value — not its own state.

```
config === null  →  <LoginDialog>
config !== null  →  <RolesRouter>  (page determined by config.role)
```

`App.tsx` subscribes to the store with `useAuthStore()` and conditionally renders accordingly. When `logout()` is called from anywhere (TopBar button, failed refresh), the store sets `config = null` and App re-renders to the login screen automatically.

---

## What lives where

| State | Location | Rationale |
|---|---|---|
| `config` (auth) | `useAuthStore` | global, needed everywhere |
| `connStatus` (WebSocket) | `useState` in `RolesRouter` | scoped to the active WS session |
| `urlInput`, `otpInput`, `dialogOpen` | `useState` in `LoginPage` | purely local form state |
| `name`, `age` | `useState` in `Reception` | local form state |
| Theme | `ThemeProvider` (next-themes) | framework manages localStorage sync |
| Global error dialog | `GlobalErrorProvider` context | display-only, no business logic |

---

## Removed

- **`ConfigContext`** — deleted. Components that previously read from it now call `useAuthStore()` directly.  
- **`saveClientData`** — merged into `storeConfig` (same implementation).  
- **`Api.refreshAuth` static method** — refresh logic now lives entirely in the store.  
- **`refreshCreds` prop drilling** — `App → RolesRouter → ConfigContext.Provider → consumers`. Replaced by direct store access at each consumer.
- **Circular import** — `config_provider → LoginPage → api_access → config_provider` is gone. `ClientData` now lives in `config_provider.ts`.

---

## Adding a new authenticated endpoint

1. Add a method to the relevant `*Api` class in `api_access.ts`.
2. Start the method with `await this.refreshCreds()`.
3. Read `useAuthStore.getState().config!` **after** the refresh call for the JWT.
4. Parse the response with a Zod schema + `errorUnionSchema`.
