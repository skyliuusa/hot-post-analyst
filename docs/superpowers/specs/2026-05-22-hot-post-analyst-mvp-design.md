# Hot Post Analyst MVP Product Spec

Date: 2026-05-22

Status: Draft for user review. This spec defines the first usable product MVP behind the current React design prototype.

Related design prototype:

- `src/App.tsx`
- `design/landing/screenshots/landing-desktop.png`
- `design/landing/screenshots/today-desktop.png`
- `design/landing/screenshots/saved-desktop.png`
- `design/landing/screenshots/saved-hook-desktop.png`
- `design/landing/screenshots/saved-topic-desktop.png`
- `design/landing/screenshots/draft-desktop.png`
- `design/landing/screenshots/review-desktop.png`

## Product Intent

Hot Post Analyst helps creators and content operators turn saved viral posts into the next piece of content they should draft.

The MVP should answer one operating question:

> 我收藏了很多热帖，这周最该复刻哪一条？应该怎么改写成我自己的内容？

The product is not a viral-post database, a social scraping suite, or a publishing tool. It is a private decision workspace that helps the user import content signals, correct the extracted information, compare reusable structures, draft a new post brief, and record whether the replication worked.

## Target User

Primary user:

- Solo creator, founder, marketer, content operator, or small team member.
- Regularly saves posts from 小红书, 公众号, and X.
- Has too many screenshots, links, and notes, but too little clarity on what to write next.
- Wants concrete content decisions, not a generic analytics dashboard.

Primary job:

- Import a hot post.
- Extract the cover, title, opening hook, topic, engagement, and comments.
- Decide whether it is worth replicating.
- Turn the signal into a draft brief.
- Review the result after publishing.

## MVP Scope

### In Scope

The MVP includes:

1. Semi-automatic import from 小红书, 公众号, and X links.
2. Image upload and OCR import.
3. Manual creation and manual correction.
4. A correction workspace where users can upload additional images and re-run parsing.
5. Post signal analysis and scoring.
6. Saved content browsing through three views:
   - 封面/首图
   - 标题 + 内容前三行钩子
   - 选题
7. Detail view that combines cover, hook, topic, analysis, and draft entry.
8. Draft brief generation.
9. Manual review result logging.
10. Core error and incomplete-field states.

### Out of Scope

The MVP does not include:

- Fully automated platform crawling.
- Platform account login or authenticated scraping.
- Bulk background collection.
- Auto-publishing to platforms.
- Team permissions and workspace roles.
- Complex analytics dashboards.
- Billing and subscription management.
- Browser extension capture.
- Cross-device sync beyond whatever storage the MVP implementation chooses.

These can be added later only after the core import-to-draft workflow proves useful.

## Core Workflow

### 1. Import Entry

The user can start from three entry points:

1. Paste a link.
2. Upload one or more images.
3. Create manually.

Supported link sources for MVP:

- 小红书
- 公众号
- X
- Other URL as a manual fallback path

Preferred behavior:

- A link import tries to auto-fill as many fields as possible.
- An image import runs OCR and classifies the image as cover, content screenshot, or comment screenshot when possible.
- A manual import starts with empty fields but still allows image upload and OCR extraction inside the correction workspace.

### 2. Parse And OCR

The system creates an `ImportSession` for every import attempt.

For link import, platform adapters attempt to extract:

- Source platform
- Original URL
- External post id if available
- Title
- Author name if available
- Main text or summary
- First image or cover image
- Published time if available
- Engagement counts if visible
- Comment snippets if available

For image import, OCR attempts to extract:

- Title-like text
- Content first lines
- Comment text
- Visible engagement numbers
- Platform hints
- Image role: cover, content screenshot, comment screenshot, unknown

小红书 image behavior:

- If OCR detects 小红书-specific interface text or visual context, default `sourcePlatform` to `xiaohongshu`.
- The user can override the platform in the correction workspace.

Confidence handling:

- Extracted fields have confidence labels: high, medium, low.
- Low-confidence fields are shown as suggestions requiring confirmation.
- Existing user-edited fields are not overwritten automatically by later OCR or parsing.

### 3. Correction Workspace

Every import path lands in the correction workspace before saving.

The correction workspace is a structured completion surface, not a simple form.

Required user actions:

- Review extracted fields.
- Confirm or edit required fields.
- Save the item into the workspace.

Fields shown:

- Platform: 小红书 / 公众号 / X / 其他
- Original URL
- Title
- Cover / first image
- Opening hook: title plus first three content lines
- Body summary
- Comment summary
- Engagement metrics: likes, saves, comments, reposts, views if relevant
- Topic label
- Tags
- Notes

Image upload inside correction workspace:

- The user can upload additional images at any time before saving.
- The system runs OCR on newly uploaded images.
- The first uploaded or selected image can become the cover / first image.
- Additional images can be marked as content screenshot or comment screenshot.
- OCR output appears as suggested fills beside empty or low-confidence fields.
- If a user has already edited a field, the system asks before replacing it.

Save rules:

- Required to save: platform, title or hook text, and at least one of original URL, image, or body summary.
- Optional but recommended: cover image, engagement metrics, comment summary, topic label.
- Missing recommended fields should create warnings, not hard blockers.

### 4. Analyze And Save

After confirmation, the system creates a `PostSignal`.

The analysis should generate:

- Replication score
- Cover signal
- Hook signal
- Topic cluster
- Comment demand signal
- Recommended next action
- Draft seed

The MVP analysis should be explainable. A user should be able to see why a post is recommended instead of only seeing a score.

### 5. Saved Workspace

Saved posts are browsed through three lenses that match the current design prototype.

#### Cover / First Image

Purpose:

- Fast visual scanning.
- Identify reusable cover structure.
- Compare layout, promise, contrast, and proof.

Card content:

- Cover / first image
- Replication score
- Topic label
- Title

#### Hook

Purpose:

- Compare title and first three lines.
- Decide whether the opening structure can be rewritten.

Card content:

- Score
- Topic
- Title
- First three hook lines

#### Topic

Purpose:

- See repeated demand areas.
- Choose the next content direction rather than a single post.

Card content:

- Topic name
- Number of related posts
- Highest scoring post
- Suggested next action

### 6. Detail View

Clicking any saved post opens a detail view.

Layout:

- Left: cover / first image.
- Middle: topic, hook lines, core structure, comment demand.
- Right: draft entry.

Detail view requirements:

- It must work regardless of which saved lens opened it.
- It must show the same underlying `PostSignal`.
- The right panel must take the user to the draft brief for that signal.

### 7. Draft Brief

Draft generation uses the selected `PostSignal` and produces a practical brief, not a complete final article by default.

MVP generated output:

- 3 title options.
- 1 cover promise.
- 1 opening hook structure.
- 1 content outline.
- Suggested angle transformation: keep, narrow, reverse, localize, personal proof, or mistake list.

User controls:

- Regenerate title only.
- Regenerate opening only.
- Edit the brief manually.
- Mark brief as used or discarded.

### 8. Review

After publishing, the user can record results manually.

Review fields:

- Published platform
- Published time
- Final title
- Views
- Likes
- Saves
- Comments
- Reposts
- Notes
- Decision: continue, change angle, or discard

Review output:

- Result summary.
- What worked.
- What to change next.
- Whether this topic or structure should remain in the recommendation pool.

## Data Model

### ImportSession

Represents an in-progress import before the user confirms it.

Fields:

- `id`
- `sourceType`: link, image, manual
- `sourcePlatform`: xiaohongshu, wechat, x, other, unknown
- `sourceUrl`
- `status`: created, parsing, needsReview, failed, saved
- `rawText`
- `uploadedAssets`
- `extractedFields`
- `fieldConfidence`
- `parseErrors`
- `createdAt`
- `updatedAt`

### ImportedAsset

Represents an uploaded or parsed image.

Fields:

- `id`
- `importSessionId`
- `type`: cover, contentScreenshot, commentScreenshot, unknown
- `fileUrl` or local storage reference
- `ocrText`
- `ocrConfidence`
- `isSelectedCover`
- `createdAt`

### PostSignal

Represents a saved hot post signal after correction and analysis.

Fields:

- `id`
- `sourcePlatform`
- `sourceUrl`
- `title`
- `coverAssetId`
- `hookLines`
- `bodySummary`
- `commentSummary`
- `topic`
- `tags`
- `metrics`
- `replicationScore`
- `coverSignal`
- `hookSignal`
- `topicClusterId`
- `commentDemandSignal`
- `recommendedNextAction`
- `draftSeed`
- `status`: saved, drafted, published, archived
- `createdAt`
- `updatedAt`

### TopicCluster

Represents a reusable topic direction.

Fields:

- `id`
- `name`
- `postSignalIds`
- `bestPostSignalId`
- `postCount`
- `averageScore`
- `latestSignalAt`

### DraftBrief

Represents generated or edited draft guidance.

Fields:

- `id`
- `postSignalId`
- `titleOptions`
- `coverPromise`
- `openingHook`
- `outline`
- `angleTransformation`
- `status`: draft, used, discarded
- `createdAt`
- `updatedAt`

### ReviewResult

Represents post-publication outcome.

Fields:

- `id`
- `draftBriefId`
- `postSignalId`
- `publishedPlatform`
- `publishedAt`
- `finalTitle`
- `metrics`
- `notes`
- `decision`: continue, changeAngle, discard
- `nextAction`
- `createdAt`
- `updatedAt`

## Platform Import Strategy

### Adapter Interface

Each platform importer should follow the same shape:

- `detect(url): boolean`
- `parse(url): ParsedImportResult`
- `normalize(result): ExtractedFields`

Adapters are best-effort. They should not be the only path into the product.

### 小红书

Priority fields:

- Cover / first image
- Title
- First visible body lines
- Likes, saves, comments when visible
- Comment snippets if available

Fallback:

- User uploads screenshots.
- OCR marks platform as 小红书 when context is detected.

### 公众号

Priority fields:

- Article title
- Cover image if available
- Author / account name if available
- First paragraphs
- Published time if available

Fallback:

- User pastes article text or uploads screenshots.

### X

Priority fields:

- Tweet text
- Author handle if available
- Engagement numbers if available
- Thread context if visible

Fallback:

- User uploads screenshot or manually pastes text.

### Other URL

Other URLs become manual imports with the original URL preserved.

## Scoring And Analysis

The MVP score should be transparent and stable enough for user trust.

Initial scoring dimensions:

- Hook clarity
- Cover specificity
- Evidence or proof strength
- Comment demand
- Platform fit
- Topic repetition
- Replication effort

Score output:

- Numeric score from 0 to 100.
- Short explanation.
- One recommended next action.

The score should not pretend to predict virality. It ranks whether the item is worth turning into the user's next draft.

## UI Pages And States

### Landing

Purpose:

- Explain the promise.
- Show the product shell.
- Drive one restrained CTA.

### Today

Purpose:

- Show the single recommended post or topic for the current work session.

States:

- Has recommendation.
- Empty workspace.
- Analysis pending.

### Import

Purpose:

- Accept link, image upload, or manual start.

States:

- Idle.
- Link parsing.
- OCR processing.
- Parse failed with fallback.
- Unsupported link.

### Correction Workspace

Purpose:

- Confirm extracted fields and add missing context.

States:

- Fields ready for review.
- Low-confidence OCR suggestions.
- Missing required fields.
- Uploading additional images.
- Saving.
- Save failed.

### Saved

Purpose:

- Browse saved signals through cover, hook, and topic lenses.

States:

- Cover lens.
- Hook lens.
- Topic lens.
- Empty saved list.
- Detail open.

### Draft

Purpose:

- Convert selected signal into a draft brief.

States:

- Generating.
- Generated brief.
- Generation failed.
- Edited brief.

### Review

Purpose:

- Record outcome and decide whether to continue, change angle, or discard.

States:

- No published result.
- Editing result.
- Result saved.

## Error Handling

Import errors should be recoverable.

Required error behaviors:

- Link parse failed: keep URL, show manual fields, allow image upload.
- OCR failed: keep uploaded image, allow manual entry.
- OCR low confidence: show suggested fields but require confirmation.
- Platform unknown: default to `其他`, allow user correction.
- Missing required fields: show inline field errors.
- Save failed: preserve user input and retry.
- Draft generation failed: keep analysis data and allow manual draft creation.

The product should never trap the user in an import failure state.

## Privacy And Data Assumptions

MVP should assume the workspace is private.

Requirements:

- Imported links, screenshots, OCR text, analysis, drafts, and review notes are private by default.
- If external AI or OCR services are used, the implementation must make that explicit in product settings or onboarding.
- The MVP should preserve original sources for user reference but should not republish source content automatically.

## Acceptance Criteria

The MVP is acceptable when these user-visible behaviors work:

1. User can paste a 小红书, 公众号, or X link and enter a correction workspace with auto-filled fields when parsing succeeds.
2. If link parsing fails, user can still save the item by manually completing required fields.
3. User can upload one or more images at import start.
4. User can upload additional images inside the correction workspace.
5. OCR output can suggest title, hook lines, comments, metrics, and platform.
6. OCR suggestions do not silently overwrite user-edited fields.
7. User can confirm a corrected item and create a saved `PostSignal`.
8. Saved items appear in cover, hook, and topic views.
9. Clicking a saved item opens detail with cover, analysis, and draft entry.
10. User can generate or edit a draft brief with title options, cover promise, opening hook, and outline.
11. User can record review results after publishing.
12. Parse failure, OCR failure, missing fields, save failure, and draft generation failure have visible recovery paths.

## Implementation Order Recommendation

This spec should be implemented in phases:

1. Data model and local persistence.
2. Manual import and correction workspace.
3. Image upload and OCR suggestion workflow.
4. Link adapter interface with one platform wired first.
5. Saved three-lens workspace using real data.
6. Detail view and draft brief generation.
7. Review logging.
8. Additional platform adapters.

This order keeps the product usable even before every parser works.

## Open Product Decisions Resolved For MVP

- The MVP supports 小红书, 公众号, and X, but adapters are best-effort.
- Auto-fill is preferred, but user correction is required before saving.
- Image OCR is a first-class import path and a correction-page supplement.
- The product ranks replication usefulness, not predicted virality.
- The source of truth after import is the corrected `PostSignal`, not the raw platform page.
