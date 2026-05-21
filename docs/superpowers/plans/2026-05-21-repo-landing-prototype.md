# Repo Landing Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repo-contained React + Tailwind landing design prototype that replaces Figma as the visual source for review.

**Architecture:** Create a small Vite app under `design/landing` with one focused first-viewport landing prototype. Keep it isolated from future production code, but use realistic tokens and component structure so approved design decisions can later be copied into the real app. Capture desktop and mobile screenshots into git for review and version history.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Playwright screenshot script.

---

### Task 1: Prototype App Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

- [ ] **Step 1: Add project dependencies**

Create a root Vite React app with Tailwind and Playwright as development tooling.

- [ ] **Step 2: Add minimal Vite config**

Expose the prototype at the repo root dev server.

- [ ] **Step 3: Add Tailwind config**

Scan `index.html` and `src/**/*.{ts,tsx}`.

- [ ] **Step 4: Add empty React entry**

Render `App` from `src/main.tsx`.

### Task 2: Focused Landing Prototype

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Build the first viewport**

Use the approved Chinese copy:

- `选出最值得复刻的那条热帖。`
- `把收藏的爆款内容，变成下一篇能发布的草稿。`
- `已分类 14,820 条内容信号...`

- [ ] **Step 2: Hide secondary features**

Represent functionality through an icon-only sidebar and top bar controls.

- [ ] **Step 3: Keep the visual focus narrow**

Show one recommendation card, one decision headline, and one next action.

### Task 3: Screenshot Workflow

**Files:**
- Create: `scripts/capture-design.mjs`
- Create: `design/landing/screenshots/.gitkeep`

- [ ] **Step 1: Add Playwright screenshot script**

Open local Vite URL and capture:

- `design/landing/screenshots/desktop.png` at 1440x980.
- `design/landing/screenshots/mobile.png` at 390x844.

- [ ] **Step 2: Add npm script**

Add `design:capture` to `package.json`.

### Task 4: Verification And Commit

**Files:**
- Verify all created files.

- [ ] **Step 1: Run build**

Run `npm run build`.

- [ ] **Step 2: Run screenshot capture**

Run the local dev server and `npm run design:capture`.

- [ ] **Step 3: Commit**

Commit the prototype files and screenshots. Do not commit `.superpowers` companion state noise.
