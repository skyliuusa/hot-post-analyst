# Hot Post Analyst Landing Page UI Design

Date: 2026-05-21

Status: Draft for review. Implementation is intentionally paused.

## Goal

Design a focused B2B SaaS landing page for Hot Post Analyst before writing React code.

The landing page should communicate one product promise:

> Pick the post worth recreating.

This is narrower and stronger than "analyze viral posts." The product should feel like a quiet decision workspace for creators and content operators who save too many viral posts but need to decide what to draft next.

## Core User Problem

Creators and small content teams collect viral posts, screenshots, comments, and platform signals, but the collection often does not become output. The landing page should show that Hot Post Analyst turns the pile into one next action.

Primary user question:

> Which saved post should I recreate this week, and what should I do next?

## Design Principles

1. Reduce visible text.
2. Reduce visible buttons.
3. Hide secondary features inside a sidebar and top bar.
4. Show one product decision, not a complex dashboard.
5. Use the product screenshot as the trust anchor.
6. Avoid generic SaaS sections unless they support the core promise.

## Recommended Page Direction

Use a product-led, minimal B2B SaaS page.

The first viewport should include:

- Small brand/top bar.
- Left-side product promise with one short supporting sentence.
- One quiet trust line.
- Large product screenshot on the right.
- Product screenshot includes a sidebar, top bar, one recommended post, and one next action.

The page should not lead with a centered hero, gradient text, many CTAs, logo soup, or a dense analytics dashboard.

## First Viewport Content

### Top Bar

Visible items:

- Brand mark and `Hot Post Analyst`.
- Optional status text such as `Private workspace`.
- Icon-only search/settings/sync controls.

Hidden or de-emphasized:

- Full navigation links.
- Multiple visible CTAs.
- Feature menu labels.

The top bar should feel like a product shell, not a marketing nav.

### Hero Copy

Preferred headline:

> Pick the post worth recreating.

Supporting copy:

> A quiet workspace that turns saved viral posts into the next draft.

Trust line:

> 14,820 posts classified across hooks, covers, demand signals, and repeatability. Built for private, local-first creator research.

CTA treatment:

- Avoid large competing buttons in the main visual direction.
- If a CTA is needed, use one restrained primary action only.
- A screenshot-led interaction can replace the standard hero button.

## Product Screenshot Concept

The product screenshot should communicate the full value proposition without explaining every feature.

Visible structure:

- Left sidebar with icon-only sections.
- Top bar with current workspace context and hidden controls.
- Main area with one recommended post.
- Right or lower panel with the next action.

Visible content:

- Recommendation score, e.g. `Score 86`.
- Post summary, e.g. `Checklist cover with concrete proof`.
- Action headline, e.g. `Draft this one.`
- Next step, e.g. `Write three title variants`.

The screenshot should avoid:

- Multiple charts.
- Large tables.
- Dense metric grids.
- Three-column feature cards.
- Long AI-generated explanations.

## Information Architecture

### Landing Page Sections

1. Hero: core promise and product screenshot.
2. Workflow: one line per stage, not a feature dump.
   - Save
   - Rank
   - Draft
   - Review
3. Proof: short operational proof with organic numbers.
4. Focused feature reveal: show what the hidden sidebar/top bar contains.
5. Final CTA: one decision-oriented call to action.

### Product Navigation In Screenshot

Sidebar icon groups:

- Today
- Saved posts
- Drafts
- Reviews

Top bar controls:

- Search
- Sync
- Settings

These controls should visually imply capability without competing with the main decision.

## Visual System

### Style

Modern B2B SaaS, minimal, product-led, calm, operator-focused.

Avoid:

- Purple/blue AI gradients.
- Neon glows.
- Decorative blobs.
- Emoji icons.
- Generic 3-card feature rows.
- Overly dense analytics UI.

### Palette

Use a neutral off-white background with zinc/charcoal text and one restrained teal accent.

Suggested tokens:

- Background: `#fafbf7`
- Surface: `#ffffff`
- Text: `#18181b`
- Muted text: `#686f68`
- Border: `#e2e6df`
- Accent: `#0f766e`

### Typography

Use a high-quality sans-serif stack. Preferred production choice:

- Geist Sans or Satoshi for display and body.
- Tabular figures for scores and metrics.

Avoid Inter as the named premium font choice, unless the implementation environment already forces it.

### Layout

Desktop:

- Max width around 1180-1240px.
- Two-column hero: copy on left, product screenshot on right.
- Screenshot should carry more visual weight than text.

Mobile:

- Single column.
- Copy first, screenshot second.
- Hide full top navigation.
- Keep screenshot simplified and avoid horizontal scrolling.

## Interaction And States

The design should define states before implementation:

- Button pressed state if a visible CTA exists.
- Sidebar active state.
- Top bar icon hover/focus state.
- Screenshot recommendation active state.
- Reduced-motion fallback.

Since the landing page should be calm, motion should be subtle:

- Fade/translate entrance.
- No continuous decorative animation.
- No scroll hijacking.

## Implementation Readiness Checklist

Before building React + Tailwind:

- Confirm final headline and supporting copy.
- Confirm whether there is one visible CTA or screenshot-led CTA only.
- Create a final desktop frame.
- Create a mobile frame.
- Define design tokens for color, type, radius, border, and shadow.
- Decide whether to create the UI in Figma first or continue with browser mockups.

## Recommended Tooling

Primary recommendation:

- Use Figma for final UI frames, component states, and developer handoff.

Fast iteration:

- Continue using Codex visual companion for rough layout and product-core iterations.

Implementation:

- React + Tailwind after the UI frame is approved.

Quality checks:

- Use design-taste-frontend rules for anti-template layout, color discipline, and density control.
- Use ui-ux-pro-max checklist for accessibility, responsive behavior, interaction states, and contrast.

## Open Decisions

1. Should the first viewport include a visible CTA button, or should the product screenshot action be the primary CTA cue?
2. Should the final visual design be produced in Figma before implementation?
3. Should the landing page use English copy only, Chinese copy only, or bilingual copy?

## Out Of Scope For This Design Phase

- React implementation.
- Tailwind component code.
- Backend/API integration.
- Real analytics data.
- Pricing logic.
- Authentication flows.

## Current Recommendation

Finalize the first viewport around this sentence:

> Pick the post worth recreating.

Then create one high-fidelity desktop frame and one mobile frame. Once those are approved, implementation can proceed with much less rework.
