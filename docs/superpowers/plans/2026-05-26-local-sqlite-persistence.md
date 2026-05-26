# Local SQLite Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local SQLite-backed persistence behind the current React workspace store.

**Architecture:** Create a small Node server using built-in `node:sqlite`, serve the built Vite app from `dist`, expose workspace JSON APIs, and make the frontend hydrate/save through those APIs with `localStorage` fallback.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Node v26 `node:sqlite`, Node `node:test`.

---

### Task 1: Server Repository And API

**Files:**
- Create: `server/workspaceRepository.mjs`
- Create: `server/index.mjs`
- Test: `server/workspaceRepository.test.mjs`
- Modify: `package.json`

- [ ] Write failing Node tests for saving and loading `postSignal`, `draftBrief`, and `reviewResult` records newest-first.
- [ ] Implement SQLite table creation, upsert, load, and clear helpers.
- [ ] Implement API routes for `GET /api/workspace` and `PUT /api/workspace/:collection/:id`.
- [ ] Add `serve:local` and `test:server` scripts.

### Task 2: Frontend API Repository

**Files:**
- Create: `src/services/workspaceApi.ts`
- Modify: `src/state/workspaceStore.ts`
- Test: `src/state/workspaceStore.test.ts`

- [ ] Write failing hook tests for API hydration and API save calls.
- [ ] Add typed API helpers with graceful failure behavior.
- [ ] Update `useWorkspaceStore` to hydrate from API after mounting and save optimistically to API plus `localStorage`.

### Task 3: Verification

**Files:**
- Verify all changed files.

- [ ] Run `npm run test:server`.
- [ ] Run `npm run test:run`.
- [ ] Run `npm run build`.
- [ ] Run `npm run serve:local` and verify the app responds locally.
