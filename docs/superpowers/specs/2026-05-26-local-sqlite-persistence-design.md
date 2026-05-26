# Local SQLite Persistence Design

Date: 2026-05-26

Status: Approved in chat. Implementation follows this spec.

## Goal

Move Hot Post Analyst from browser-only `localStorage` persistence to a local SQLite database that can run on the user's own machine and be accessed securely through Tailscale.

## Architecture

The app remains a Vite React frontend. A small local Node server serves the production `dist` assets and exposes JSON API endpoints for workspace data. The server stores records in a SQLite database file under `data/hot-post-analyst.sqlite`.

The frontend keeps an in-memory optimistic store. On startup it first reads the existing `localStorage` fallback, then attempts to hydrate from `/api/workspace`. Saves update the UI immediately and write to SQLite through `/api/workspace/:collection/:id`. If the API is unavailable, the existing `localStorage` fallback still works.

## Data Model

Use one SQLite table for the current MVP:

- `workspace_items`
  - `kind`: `postSignal`, `draftBrief`, or `reviewResult`
  - `id`: entity id
  - `payload`: full JSON entity
  - `updated_at`: ISO timestamp used for newest-first ordering

This intentionally avoids premature relational schema design. The current domain objects are still evolving, and a JSON payload table keeps migration cost low for a personal single-user tool.

## Deployment Shape

Local use:

```bash
npm run build
npm run serve:local
```

Remote personal access:

- Use Tailscale to reach the machine running `serve:local`.
- Do not expose the server directly to the public internet.
- Cloudflare Tunnel can be added later if a public custom domain is required.

## Non-goals

- No multi-user auth.
- No cloud database.
- No platform crawler.
- No Tailscale configuration automation.
- No file binary persistence yet. Uploaded image URLs remain browser object/local URLs in the current MVP.
