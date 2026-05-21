# Hot Post Analyst Landing Page UI Design

Date: 2026-05-21

Status: Draft for review. Implementation is intentionally paused. The next design step is Figma, not React implementation.

Figma draft:

https://www.figma.com/design/0mCQSOVBhqLOSH6YVrLeZU

## Goal

Design a focused B2B SaaS landing page for Hot Post Analyst before writing React code.

The landing page should communicate one product promise. Final landing copy should be Chinese only:

> 选出最值得复刻的那条热帖。

This is narrower and stronger than "analyze viral posts." The product should feel like a quiet decision workspace for creators and content operators who save too many viral posts but need to decide what to draft next.

## Core User Problem

Creators and small content teams collect viral posts, screenshots, comments, and platform signals, but the collection often does not become output. The landing page should show that Hot Post Analyst turns the pile into one next action.

Primary user question:

> 这一周我应该复刻哪条热帖，下一步该做什么？

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
- Status text such as `私有工作区`.
- Icon-only search/settings/sync controls.
- One restrained visible CTA in the top-right, e.g. `开始使用`.

Hidden or de-emphasized:

- Full navigation links.
- Multiple visible CTAs.
- Feature menu labels.

The top bar should feel like a product shell, not a marketing nav.

### Hero Copy

Preferred headline:

> 选出最值得复刻的那条热帖。

Supporting copy:

> 把收藏的爆款内容，变成下一篇能发布的草稿。

Trust line:

> 已分类 14,820 条内容信号，覆盖标题钩子、封面、评论需求和可复刻性。数据保留在你的本地工作区。

CTA treatment:

- Avoid large competing buttons in the main visual direction.
- Keep one restrained visible CTA in the top bar only.
- Do not place multiple large hero buttons in the body.
- The product screenshot action should reinforce the CTA but not create a second competing marketing button.

Definition:

- A visible CTA is an action the user can see without opening a menu or scrolling, such as `开始使用`.
- For this design, the visible CTA should be small, top-right, and visually subordinate to the product screenshot.

## Product Screenshot Concept

The product screenshot should communicate the full value proposition without explaining every feature.

Visible structure:

- Left sidebar with icon-only sections.
- Top bar with current workspace context and hidden controls.
- Main area with one recommended post.
- Right or lower panel with the next action.

Visible content:

- Recommendation score, e.g. `评分 86`.
- Post summary, e.g. `带具体证据的清单封面`.
- Action headline, e.g. `先写这条`.
- Next step, e.g. `写 3 个标题版本`.

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
   - 收藏
   - 排序
   - 起稿
   - 复盘
3. Proof: short operational proof with organic numbers.
4. Focused feature reveal: show what the hidden sidebar/top bar contains.
5. Final CTA: one decision-oriented call to action.

### Product Navigation In Screenshot

Sidebar icon groups:

- 今日
- 收藏
- 草稿
- 复盘

Top bar controls:

- 搜索
- 同步
- 设置

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

- Final headline and supporting copy are Chinese only.
- Use one restrained visible CTA in the top bar; avoid body CTA clutter.
- Create a final desktop frame in Figma.
- Create a mobile frame in Figma.
- Define design tokens for color, type, radius, border, and shadow.
- Use Figma as the source of truth before implementation.

## Recommended Tooling

Primary recommendation:

- Use Figma for final UI frames, component states, and developer handoff.
- Build the Figma design before any React + Tailwind implementation.

Current Figma draft includes:

- `Desktop / Landing first viewport`
- `Mobile / Landing first viewport`
- `Design Tokens / Landing`

Fast iteration:

- Continue using Codex visual companion for rough layout and product-core iterations.

Implementation:

- React + Tailwind after the UI frame is approved.

Quality checks:

- Use design-taste-frontend rules for anti-template layout, color discipline, and density control.
- Use ui-ux-pro-max checklist for accessibility, responsive behavior, interaction states, and contrast.

## Open Decisions

1. What should the exact Chinese CTA label be: `开始使用`, `创建复刻清单`, or another phrase?
2. Should the Figma file include only landing page frames, or also a small product UI component kit?

## Out Of Scope For This Design Phase

- React implementation.
- Tailwind component code.
- Backend/API integration.
- Real analytics data.
- Pricing logic.
- Authentication flows.

## Current Recommendation

Finalize the first viewport around this sentence:

> 选出最值得复刻的那条热帖。

Then create one high-fidelity desktop frame and one mobile frame in Figma. Once those are approved, implementation can proceed with much less rework.
