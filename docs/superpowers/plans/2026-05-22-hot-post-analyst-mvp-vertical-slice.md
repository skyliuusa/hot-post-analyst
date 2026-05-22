# Hot Post Analyst MVP Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current static React design prototype into a local, testable MVP workflow for importing hot-post signals, correcting extracted fields, browsing saved posts, creating draft briefs, and logging reviews.

**Architecture:** Keep the existing Vite React app and split the current single-file prototype into focused domain, service, and feature modules. Use local persistence for the first vertical slice, with link parsing and OCR behind replaceable service interfaces so the UI and data workflow are not coupled to one parser provider.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v3, Vitest, React Testing Library, Playwright screenshot script, browser localStorage.

---

## Scope Boundary

This plan implements the first usable product slice from the MVP spec:

- Import entry for link, image, and manual creation.
- Correction workspace with additional image upload and OCR suggestion application.
- Local `PostSignal` persistence.
- Saved workspace using real persisted data.
- Detail view, draft brief creation, and review logging.
- Service interfaces for 小红书, 公众号, X link parsing and OCR.

This plan does not build authenticated platform crawling, auto-publishing, billing, team permissions, or background bulk collection.

The link parser and OCR service should be implemented as deterministic local services first, with interfaces shaped for later replacement by a server-side parser or external OCR provider. The MVP must keep working when parsing fails by routing the user into manual correction.

## File Structure

Create or modify these files:

- Modify: `package.json` — add test scripts and test dependencies.
- Create: `vitest.config.ts` — configure jsdom tests.
- Create: `src/test/setup.ts` — test setup for React Testing Library.
- Create: `src/domain/types.ts` — shared product types.
- Create: `src/domain/analysis.ts` — scoring, topic clustering, draft seed generation.
- Create: `src/domain/importSession.ts` — import session reducer and field merge rules.
- Create: `src/services/storage.ts` — localStorage repository.
- Create: `src/services/linkImport.ts` — platform detection and link parsing interface.
- Create: `src/services/ocrImport.ts` — OCR suggestion interface.
- Create: `src/state/workspaceStore.ts` — React hook for local workspace state.
- Create: `src/features/import/ImportEntry.tsx` — import start UI.
- Create: `src/features/import/CorrectionWorkspace.tsx` — correction and upload UI.
- Create: `src/features/saved/SavedWorkspace.tsx` — saved three-lens workspace.
- Create: `src/features/draft/DraftWorkspace.tsx` — draft brief UI.
- Create: `src/features/review/ReviewWorkspace.tsx` — review logging UI.
- Modify: `src/App.tsx` — route shell and composition.
- Modify: `scripts/capture-design.mjs` — add import and correction screenshots.

Tests:

- Create: `src/domain/analysis.test.ts`
- Create: `src/domain/importSession.test.ts`
- Create: `src/services/linkImport.test.ts`
- Create: `src/services/ocrImport.test.ts`
- Create: `src/state/workspaceStore.test.ts`
- Create: `src/features/import/CorrectionWorkspace.test.tsx`
- Create: `src/features/saved/SavedWorkspace.test.tsx`

## Task 1: Test Harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Add test dependencies**

Run:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: npm installs the test packages and updates `package-lock.json`.

- [ ] **Step 2: Update package scripts**

In `package.json`, add these scripts while keeping the existing scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "design:capture": "node scripts/capture-design.mjs",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Create test setup**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:run
```

Expected: PASS with no tests found or PASS after later tests are added. If Vitest exits non-zero because no tests exist, continue to Task 2 and rerun after adding the first test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "Add test harness"
```

## Task 2: Domain Types And Analysis

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/analysis.ts`
- Test: `src/domain/analysis.test.ts`

- [ ] **Step 1: Write failing analysis tests**

Create `src/domain/analysis.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyzeCorrection, buildDraftBrief, groupTopicClusters } from './analysis';
import type { CorrectedImport } from './types';

const baseImport: CorrectedImport = {
  sourcePlatform: 'xiaohongshu',
  sourceUrl: 'https://www.xiaohongshu.com/explore/example',
  title: '带具体证据的清单封面',
  coverAssetId: 'asset-1',
  hookLines: ['我把一套内容流程跑了 21 天。', '真正有效的不是灵感。', '最后一个决定保存率。'],
  bodySummary: '用真实执行证据承接清单方法。',
  commentSummary: '评论区追问流程细节和检查点。',
  topic: '内容流程',
  tags: ['清单', '流程'],
  metrics: { likes: 1200, saves: 860, comments: 92, reposts: 31 },
  notes: '适合复刻成个人流程版本。',
};

describe('analyzeCorrection', () => {
  it('creates an explainable post signal from corrected import fields', () => {
    const signal = analyzeCorrection(baseImport, 'post-1');

    expect(signal.id).toBe('post-1');
    expect(signal.replicationScore).toBeGreaterThanOrEqual(70);
    expect(signal.coverSignal).toContain('封面');
    expect(signal.hookSignal).toContain('前三行');
    expect(signal.commentDemandSignal).toContain('追问');
    expect(signal.recommendedNextAction).toContain('标题');
  });
});

describe('groupTopicClusters', () => {
  it('groups saved signals by topic and picks the highest scoring post', () => {
    const first = analyzeCorrection(baseImport, 'post-1');
    const second = analyzeCorrection({ ...baseImport, title: '评论区反复问同一个问题', topic: '内容流程', metrics: { likes: 200, saves: 100, comments: 20 } }, 'post-2');

    const clusters = groupTopicClusters([first, second]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      name: '内容流程',
      postCount: 2,
      bestPostSignalId: 'post-1',
    });
  });
});

describe('buildDraftBrief', () => {
  it('creates a draft brief from a post signal', () => {
    const signal = analyzeCorrection(baseImport, 'post-1');
    const brief = buildDraftBrief(signal, 'brief-1');

    expect(brief.titleOptions).toHaveLength(3);
    expect(brief.coverPromise).toContain('证据');
    expect(brief.openingHook).toContain('21 天');
    expect(brief.status).toBe('draft');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm run test:run -- src/domain/analysis.test.ts
```

Expected: FAIL because `src/domain/analysis.ts` and `src/domain/types.ts` do not exist.

- [ ] **Step 3: Create domain types**

Create `src/domain/types.ts`:

```ts
export type SourcePlatform = 'xiaohongshu' | 'wechat' | 'x' | 'other' | 'unknown';
export type SourceType = 'link' | 'image' | 'manual';
export type Confidence = 'high' | 'medium' | 'low';
export type ImportStatus = 'created' | 'parsing' | 'needsReview' | 'failed' | 'saved';
export type AssetType = 'cover' | 'contentScreenshot' | 'commentScreenshot' | 'unknown';
export type PostSignalStatus = 'saved' | 'drafted' | 'published' | 'archived';
export type DraftBriefStatus = 'draft' | 'used' | 'discarded';
export type ReviewDecision = 'continue' | 'changeAngle' | 'discard';

export type EngagementMetrics = {
  likes?: number;
  saves?: number;
  comments?: number;
  reposts?: number;
  views?: number;
};

export type ImportedAsset = {
  id: string;
  importSessionId: string;
  type: AssetType;
  fileUrl: string;
  ocrText: string;
  ocrConfidence: Confidence;
  isSelectedCover: boolean;
  createdAt: string;
};

export type ExtractedFields = {
  sourcePlatform?: SourcePlatform;
  sourceUrl?: string;
  title?: string;
  coverAssetId?: string;
  hookLines?: string[];
  bodySummary?: string;
  commentSummary?: string;
  topic?: string;
  tags?: string[];
  metrics?: EngagementMetrics;
  notes?: string;
};

export type FieldConfidence = Partial<Record<keyof ExtractedFields, Confidence>>;

export type ImportSession = {
  id: string;
  sourceType: SourceType;
  sourcePlatform: SourcePlatform;
  sourceUrl?: string;
  status: ImportStatus;
  rawText: string;
  uploadedAssets: ImportedAsset[];
  extractedFields: ExtractedFields;
  fieldConfidence: FieldConfidence;
  userEditedFields: Array<keyof ExtractedFields>;
  parseErrors: string[];
  createdAt: string;
  updatedAt: string;
};

export type CorrectedImport = Required<Pick<ExtractedFields, 'sourcePlatform' | 'title' | 'hookLines' | 'topic'>> &
  Omit<ExtractedFields, 'sourcePlatform' | 'title' | 'hookLines' | 'topic'>;

export type PostSignal = {
  id: string;
  sourcePlatform: SourcePlatform;
  sourceUrl?: string;
  title: string;
  coverAssetId?: string;
  hookLines: string[];
  bodySummary?: string;
  commentSummary?: string;
  topic: string;
  tags: string[];
  metrics: EngagementMetrics;
  replicationScore: number;
  coverSignal: string;
  hookSignal: string;
  topicClusterId: string;
  commentDemandSignal: string;
  recommendedNextAction: string;
  draftSeed: string;
  status: PostSignalStatus;
  createdAt: string;
  updatedAt: string;
};

export type TopicCluster = {
  id: string;
  name: string;
  postSignalIds: string[];
  bestPostSignalId: string;
  postCount: number;
  averageScore: number;
  latestSignalAt: string;
};

export type DraftBrief = {
  id: string;
  postSignalId: string;
  titleOptions: string[];
  coverPromise: string;
  openingHook: string;
  outline: string[];
  angleTransformation: 'keep' | 'narrow' | 'reverse' | 'localize' | 'personalProof' | 'mistakeList';
  status: DraftBriefStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReviewResult = {
  id: string;
  draftBriefId: string;
  postSignalId: string;
  publishedPlatform: SourcePlatform;
  publishedAt: string;
  finalTitle: string;
  metrics: EngagementMetrics;
  notes: string;
  decision: ReviewDecision;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 4: Implement analysis**

Create `src/domain/analysis.ts`:

```ts
import type { CorrectedImport, DraftBrief, PostSignal, TopicCluster } from './types';

function nowIso() {
  return new Date().toISOString();
}

function slugTopic(topic: string) {
  return topic.trim().toLowerCase().replace(/\s+/g, '-');
}

function scoreMetrics(input: CorrectedImport) {
  const saves = input.metrics?.saves ?? 0;
  const comments = input.metrics?.comments ?? 0;
  const hasProof = /天|次|步骤|证据|对比|流程/.test(`${input.title} ${input.bodySummary ?? ''}`);
  const hasHook = input.hookLines.length >= 3;
  const base = 54;
  const engagement = Math.min(20, Math.round((saves + comments * 2) / 70));
  const proof = hasProof ? 12 : 4;
  const hook = hasHook ? 10 : 3;

  return Math.min(100, base + engagement + proof + hook);
}

export function analyzeCorrection(input: CorrectedImport, id: string): PostSignal {
  const createdAt = nowIso();
  const score = scoreMetrics(input);

  return {
    id,
    sourcePlatform: input.sourcePlatform,
    sourceUrl: input.sourceUrl,
    title: input.title,
    coverAssetId: input.coverAssetId,
    hookLines: input.hookLines,
    bodySummary: input.bodySummary,
    commentSummary: input.commentSummary,
    topic: input.topic,
    tags: input.tags ?? [],
    metrics: input.metrics ?? {},
    replicationScore: score,
    coverSignal: input.coverAssetId ? '封面可作为首图结构参考。' : '封面缺失，起稿前需要补一张首图。',
    hookSignal: `前三行围绕「${input.hookLines[0]}」建立进入理由。`,
    topicClusterId: `topic-${slugTopic(input.topic)}`,
    commentDemandSignal: input.commentSummary ? `评论需求：${input.commentSummary}` : '评论需求未补充，建议保存前补充。',
    recommendedNextAction: '先写 3 个标题版本，再确定封面承诺。',
    draftSeed: input.bodySummary ?? input.hookLines.join(' '),
    status: 'saved',
    createdAt,
    updatedAt: createdAt,
  };
}

export function groupTopicClusters(signals: PostSignal[]): TopicCluster[] {
  const grouped = signals.reduce<Record<string, PostSignal[]>>((result, signal) => {
    result[signal.topic] = [...(result[signal.topic] ?? []), signal];
    return result;
  }, {});

  return Object.entries(grouped).map(([topic, items]) => {
    const best = items.reduce((winner, item) => (item.replicationScore > winner.replicationScore ? item : winner), items[0]);
    const averageScore = Math.round(items.reduce((sum, item) => sum + item.replicationScore, 0) / items.length);

    return {
      id: `topic-${slugTopic(topic)}`,
      name: topic,
      postSignalIds: items.map((item) => item.id),
      bestPostSignalId: best.id,
      postCount: items.length,
      averageScore,
      latestSignalAt: items.map((item) => item.updatedAt).sort().at(-1) ?? best.updatedAt,
    };
  });
}

export function buildDraftBrief(signal: PostSignal, id: string): DraftBrief {
  const createdAt = nowIso();

  return {
    id,
    postSignalId: signal.id,
    titleOptions: [
      `${signal.topic}最容易被忽略的 3 个动作`,
      `我会这样复刻：${signal.title}`,
      `别直接照搬，先改这一个结构`,
    ],
    coverPromise: signal.coverAssetId ? `用具体证据重写「${signal.topic}」封面承诺。` : `先补一张能证明「${signal.topic}」的封面。`,
    openingHook: signal.hookLines.join('\n'),
    outline: ['原帖为什么有效', '我自己的场景怎么替换', '先发布的最小版本'],
    angleTransformation: 'personalProof',
    status: 'draft',
    createdAt,
    updatedAt: createdAt,
  };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:run -- src/domain/analysis.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/analysis.ts src/domain/analysis.test.ts
git commit -m "Add post signal domain analysis"
```

## Task 3: Import Session Field Merge Rules

**Files:**
- Create: `src/domain/importSession.ts`
- Test: `src/domain/importSession.test.ts`

- [ ] **Step 1: Write failing import session tests**

Create `src/domain/importSession.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { addAssetToSession, applyExtractedFields, createImportSession, markUserEditedField, validateCorrection } from './importSession';

describe('importSession', () => {
  it('creates a link import session for review', () => {
    const session = createImportSession({ sourceType: 'link', sourceUrl: 'https://x.com/example/status/1' });

    expect(session.sourceType).toBe('link');
    expect(session.sourcePlatform).toBe('x');
    expect(session.status).toBe('created');
  });

  it('does not overwrite user-edited fields when applying OCR suggestions', () => {
    const session = createImportSession({ sourceType: 'image' });
    const edited = markUserEditedField(session, 'title', '我的标题');
    const merged = applyExtractedFields(edited, { title: 'OCR 标题', topic: '内容流程' }, { title: 'high', topic: 'medium' });

    expect(merged.extractedFields.title).toBe('我的标题');
    expect(merged.extractedFields.topic).toBe('内容流程');
    expect(merged.fieldConfidence.topic).toBe('medium');
  });

  it('adds uploaded assets and selects the first cover candidate', () => {
    const session = createImportSession({ sourceType: 'manual' });
    const next = addAssetToSession(session, {
      id: 'asset-1',
      type: 'cover',
      fileUrl: 'blob://cover',
      ocrText: '',
      ocrConfidence: 'medium',
    });

    expect(next.uploadedAssets[0].isSelectedCover).toBe(true);
    expect(next.extractedFields.coverAssetId).toBe('asset-1');
  });

  it('requires platform, title or hook text, and at least one source body', () => {
    const session = createImportSession({ sourceType: 'manual' });

    expect(validateCorrection(session)).toEqual([
      '请选择平台。',
      '请补充标题或前三行钩子。',
      '请至少保留链接、图片或正文摘要中的一种。',
    ]);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm run test:run -- src/domain/importSession.test.ts
```

Expected: FAIL because `src/domain/importSession.ts` does not exist.

- [ ] **Step 3: Implement import session logic**

Create `src/domain/importSession.ts`:

```ts
import type { AssetType, Confidence, ExtractedFields, FieldConfidence, ImportedAsset, ImportSession, SourcePlatform, SourceType } from './types';

type CreateImportSessionInput = {
  sourceType: SourceType;
  sourceUrl?: string;
};

type AddAssetInput = {
  id: string;
  type: AssetType;
  fileUrl: string;
  ocrText: string;
  ocrConfidence: Confidence;
};

function nowIso() {
  return new Date().toISOString();
}

function detectPlatformFromUrl(url?: string): SourcePlatform {
  if (!url) return 'unknown';
  if (url.includes('xiaohongshu.com')) return 'xiaohongshu';
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x';
  return 'other';
}

export function createImportSession(input: CreateImportSessionInput): ImportSession {
  const createdAt = nowIso();
  const sourcePlatform = detectPlatformFromUrl(input.sourceUrl);

  return {
    id: `import-${crypto.randomUUID()}`,
    sourceType: input.sourceType,
    sourcePlatform,
    sourceUrl: input.sourceUrl,
    status: 'created',
    rawText: '',
    uploadedAssets: [],
    extractedFields: {
      sourcePlatform,
      sourceUrl: input.sourceUrl,
    },
    fieldConfidence: {},
    userEditedFields: [],
    parseErrors: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function markUserEditedField<K extends keyof ExtractedFields>(session: ImportSession, field: K, value: ExtractedFields[K]): ImportSession {
  return {
    ...session,
    extractedFields: {
      ...session.extractedFields,
      [field]: value,
    },
    userEditedFields: [...new Set([...session.userEditedFields, field])],
    updatedAt: nowIso(),
  };
}

export function applyExtractedFields(session: ImportSession, fields: ExtractedFields, confidence: FieldConfidence): ImportSession {
  const nextFields = { ...session.extractedFields };

  for (const [key, value] of Object.entries(fields) as Array<[keyof ExtractedFields, ExtractedFields[keyof ExtractedFields]]>) {
    if (value === undefined) continue;
    if (session.userEditedFields.includes(key)) continue;
    nextFields[key] = value;
  }

  return {
    ...session,
    status: 'needsReview',
    extractedFields: nextFields,
    fieldConfidence: {
      ...session.fieldConfidence,
      ...confidence,
    },
    updatedAt: nowIso(),
  };
}

export function addAssetToSession(session: ImportSession, input: AddAssetInput): ImportSession {
  const shouldSelectCover = input.type === 'cover' && !session.uploadedAssets.some((asset) => asset.isSelectedCover);
  const asset: ImportedAsset = {
    ...input,
    importSessionId: session.id,
    isSelectedCover: shouldSelectCover,
    createdAt: nowIso(),
  };

  return {
    ...session,
    uploadedAssets: [...session.uploadedAssets, asset],
    extractedFields: shouldSelectCover ? { ...session.extractedFields, coverAssetId: input.id } : session.extractedFields,
    updatedAt: nowIso(),
  };
}

export function validateCorrection(session: ImportSession): string[] {
  const errors: string[] = [];
  const fields = session.extractedFields;
  const hasTitleOrHook = Boolean(fields.title?.trim()) || Boolean(fields.hookLines?.some((line) => line.trim()));
  const hasSourceBody = Boolean(fields.sourceUrl?.trim()) || session.uploadedAssets.length > 0 || Boolean(fields.bodySummary?.trim());

  if (!fields.sourcePlatform || fields.sourcePlatform === 'unknown') errors.push('请选择平台。');
  if (!hasTitleOrHook) errors.push('请补充标题或前三行钩子。');
  if (!hasSourceBody) errors.push('请至少保留链接、图片或正文摘要中的一种。');

  return errors;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/domain/importSession.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/importSession.ts src/domain/importSession.test.ts
git commit -m "Add import session merge rules"
```

## Task 4: Link Import And OCR Services

**Files:**
- Create: `src/services/linkImport.ts`
- Create: `src/services/ocrImport.ts`
- Test: `src/services/linkImport.test.ts`
- Test: `src/services/ocrImport.test.ts`

- [ ] **Step 1: Write failing link import tests**

Create `src/services/linkImport.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { detectLinkPlatform, parseLink } from './linkImport';

describe('detectLinkPlatform', () => {
  it('detects supported platforms from URLs', () => {
    expect(detectLinkPlatform('https://www.xiaohongshu.com/explore/abc')).toBe('xiaohongshu');
    expect(detectLinkPlatform('https://mp.weixin.qq.com/s/demo')).toBe('wechat');
    expect(detectLinkPlatform('https://x.com/user/status/1')).toBe('x');
    expect(detectLinkPlatform('https://example.com/post')).toBe('other');
  });
});

describe('parseLink', () => {
  it('returns best-effort suggestions for supported links', async () => {
    const result = await parseLink('https://www.xiaohongshu.com/explore/abc');

    expect(result.sourcePlatform).toBe('xiaohongshu');
    expect(result.fields.title).toContain('小红书');
    expect(result.confidence.sourcePlatform).toBe('high');
  });
});
```

- [ ] **Step 2: Write failing OCR tests**

Create `src/services/ocrImport.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractOcrSuggestions } from './ocrImport';

describe('extractOcrSuggestions', () => {
  it('marks 小红书 when OCR text contains platform hints', async () => {
    const result = await extractOcrSuggestions({
      fileName: 'cover.png',
      text: '小红书 赞 收藏 评论\\n带具体证据的清单封面\\n我把一套内容流程跑了 21 天。\\n真正有效的不是灵感。',
    });

    expect(result.fields.sourcePlatform).toBe('xiaohongshu');
    expect(result.fields.title).toBe('带具体证据的清单封面');
    expect(result.fields.hookLines?.[0]).toBe('我把一套内容流程跑了 21 天。');
    expect(result.assetType).toBe('cover');
  });
});
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
npm run test:run -- src/services/linkImport.test.ts src/services/ocrImport.test.ts
```

Expected: FAIL because the service files do not exist.

- [ ] **Step 4: Implement link import service**

Create `src/services/linkImport.ts`:

```ts
import type { ExtractedFields, FieldConfidence, SourcePlatform } from '../domain/types';

type ParsedLinkResult = {
  sourcePlatform: SourcePlatform;
  fields: ExtractedFields;
  confidence: FieldConfidence;
  errors: string[];
};

export function detectLinkPlatform(url: string): SourcePlatform {
  if (url.includes('xiaohongshu.com')) return 'xiaohongshu';
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x';
  return 'other';
}

export async function parseLink(url: string): Promise<ParsedLinkResult> {
  const sourcePlatform = detectLinkPlatform(url);

  if (sourcePlatform === 'other') {
    return {
      sourcePlatform,
      fields: { sourcePlatform, sourceUrl: url },
      confidence: { sourcePlatform: 'medium', sourceUrl: 'high' },
      errors: ['暂不支持该链接自动解析，请手动补充内容。'],
    };
  }

  const platformLabel = sourcePlatform === 'xiaohongshu' ? '小红书' : sourcePlatform === 'wechat' ? '公众号' : 'X';

  return {
    sourcePlatform,
    fields: {
      sourcePlatform,
      sourceUrl: url,
      title: `${platformLabel}链接导入的热帖`,
      hookLines: ['系统已识别来源链接。', '请补充原帖前三行。', '保存前确认封面和互动数据。'],
      topic: '待确认选题',
      bodySummary: '链接已保留，正文摘要需要在修正页确认。',
    },
    confidence: {
      sourcePlatform: 'high',
      sourceUrl: 'high',
      title: 'low',
      hookLines: 'low',
      topic: 'low',
      bodySummary: 'low',
    },
    errors: [],
  };
}
```

- [ ] **Step 5: Implement OCR suggestion service**

Create `src/services/ocrImport.ts`:

```ts
import type { AssetType, ExtractedFields, FieldConfidence } from '../domain/types';

type OcrInput = {
  fileName: string;
  text: string;
};

type OcrSuggestionResult = {
  assetType: AssetType;
  fields: ExtractedFields;
  confidence: FieldConfidence;
};

function cleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectAssetType(fileName: string, text: string): AssetType {
  const value = `${fileName} ${text}`;
  if (/评论|comment/i.test(value)) return 'commentScreenshot';
  if (/正文|内容|content/i.test(value)) return 'contentScreenshot';
  return 'cover';
}

export async function extractOcrSuggestions(input: OcrInput): Promise<OcrSuggestionResult> {
  const lines = cleanLines(input.text);
  const platformHint = /小红书|赞|收藏|评论/.test(input.text) ? 'xiaohongshu' : 'unknown';
  const contentLines = lines.filter((line) => !/小红书|赞|收藏|评论/.test(line));
  const title = contentLines[0];
  const hookLines = contentLines.slice(1, 4);

  return {
    assetType: detectAssetType(input.fileName, input.text),
    fields: {
      sourcePlatform: platformHint,
      title,
      hookLines,
      topic: title ? '待确认选题' : undefined,
    },
    confidence: {
      sourcePlatform: platformHint === 'xiaohongshu' ? 'medium' : 'low',
      title: title ? 'medium' : 'low',
      hookLines: hookLines.length > 0 ? 'medium' : 'low',
      topic: 'low',
    },
  };
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test:run -- src/services/linkImport.test.ts src/services/ocrImport.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/services/linkImport.ts src/services/linkImport.test.ts src/services/ocrImport.ts src/services/ocrImport.test.ts
git commit -m "Add import parsing service interfaces"
```

## Task 5: Local Workspace Store

**Files:**
- Create: `src/services/storage.ts`
- Create: `src/state/workspaceStore.ts`
- Test: `src/state/workspaceStore.test.ts`

- [ ] **Step 1: Write failing store tests**

Create `src/state/workspaceStore.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';
import type { PostSignal } from '../domain/types';

const signal: PostSignal = {
  id: 'post-1',
  sourcePlatform: 'xiaohongshu',
  sourceUrl: 'https://www.xiaohongshu.com/explore/example',
  title: '带具体证据的清单封面',
  coverAssetId: 'asset-1',
  hookLines: ['第一行', '第二行', '第三行'],
  bodySummary: '摘要',
  commentSummary: '评论追问细节',
  topic: '内容流程',
  tags: [],
  metrics: { saves: 120 },
  replicationScore: 86,
  coverSignal: '封面可复用',
  hookSignal: '前三行清晰',
  topicClusterId: 'topic-content',
  commentDemandSignal: '评论需求明确',
  recommendedNextAction: '写标题',
  draftSeed: 'seed',
  status: 'saved',
  createdAt: '2026-05-22T00:00:00.000Z',
  updatedAt: '2026-05-22T00:00:00.000Z',
};

beforeEach(() => {
  localStorage.clear();
});

describe('useWorkspaceStore', () => {
  it('saves and reloads post signals from localStorage', () => {
    const { result, rerender } = renderHook(() => useWorkspaceStore());

    act(() => result.current.savePostSignal(signal));
    rerender();

    expect(result.current.postSignals).toHaveLength(1);
    expect(result.current.postSignals[0].title).toBe('带具体证据的清单封面');
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm run test:run -- src/state/workspaceStore.test.ts
```

Expected: FAIL because store files do not exist.

- [ ] **Step 3: Implement storage**

Create `src/services/storage.ts`:

```ts
export function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
```

- [ ] **Step 4: Implement workspace store**

Create `src/state/workspaceStore.ts`:

```ts
import { useMemo, useState } from 'react';
import type { DraftBrief, PostSignal, ReviewResult } from '../domain/types';
import { readJson, writeJson } from '../services/storage';

type WorkspaceState = {
  postSignals: PostSignal[];
  draftBriefs: DraftBrief[];
  reviewResults: ReviewResult[];
};

const STORAGE_KEY = 'hot-post-analyst.workspace.v1';

function loadWorkspace(): WorkspaceState {
  return readJson<WorkspaceState>(STORAGE_KEY, {
    postSignals: [],
    draftBriefs: [],
    reviewResults: [],
  });
}

function saveWorkspace(state: WorkspaceState) {
  writeJson(STORAGE_KEY, state);
}

export function useWorkspaceStore() {
  const [state, setState] = useState<WorkspaceState>(() => loadWorkspace());

  return useMemo(
    () => ({
      ...state,
      savePostSignal(signal: PostSignal) {
        setState((current) => {
          const next = {
            ...current,
            postSignals: [signal, ...current.postSignals.filter((item) => item.id !== signal.id)],
          };
          saveWorkspace(next);
          return next;
        });
      },
      saveDraftBrief(brief: DraftBrief) {
        setState((current) => {
          const next = {
            ...current,
            draftBriefs: [brief, ...current.draftBriefs.filter((item) => item.id !== brief.id)],
          };
          saveWorkspace(next);
          return next;
        });
      },
      saveReviewResult(review: ReviewResult) {
        setState((current) => {
          const next = {
            ...current,
            reviewResults: [review, ...current.reviewResults.filter((item) => item.id !== review.id)],
          };
          saveWorkspace(next);
          return next;
        });
      },
    }),
    [state],
  );
}
```

- [ ] **Step 5: Run test**

Run:

```bash
npm run test:run -- src/state/workspaceStore.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/storage.ts src/state/workspaceStore.ts src/state/workspaceStore.test.ts
git commit -m "Add local workspace store"
```

## Task 6: Import Entry And Correction Workspace UI

**Files:**
- Create: `src/features/import/ImportEntry.tsx`
- Create: `src/features/import/CorrectionWorkspace.tsx`
- Test: `src/features/import/CorrectionWorkspace.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing correction workspace test**

Create `src/features/import/CorrectionWorkspace.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createImportSession } from '../../domain/importSession';
import { CorrectionWorkspace } from './CorrectionWorkspace';

describe('CorrectionWorkspace', () => {
  it('shows OCR suggestions without overwriting edited fields', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const session = createImportSession({ sourceType: 'manual' });

    render(<CorrectionWorkspace initialSession={session} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('平台'), 'xiaohongshu');
    await user.type(screen.getByLabelText('标题'), '我自己改过的标题');
    await user.type(screen.getByLabelText('OCR 文本'), '小红书\\nOCR 标题\\n第一行\\n第二行\\n第三行');
    await user.click(screen.getByRole('button', { name: '解析上传内容' }));

    expect(screen.getByDisplayValue('我自己改过的标题')).toBeInTheDocument();
    expect(screen.getByDisplayValue('第一行\\n第二行\\n第三行')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm run test:run -- src/features/import/CorrectionWorkspace.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Create correction workspace component**

Create `src/features/import/CorrectionWorkspace.tsx`:

```tsx
import { useState } from 'react';
import { analyzeCorrection } from '../../domain/analysis';
import { applyExtractedFields, markUserEditedField, validateCorrection } from '../../domain/importSession';
import type { CorrectedImport, ImportSession, PostSignal, SourcePlatform } from '../../domain/types';
import { extractOcrSuggestions } from '../../services/ocrImport';

type CorrectionWorkspaceProps = {
  initialSession: ImportSession;
  onSave: (signal: PostSignal) => void;
};

export function CorrectionWorkspace({ initialSession, onSave }: CorrectionWorkspaceProps) {
  const [session, setSession] = useState(initialSession);
  const [ocrText, setOcrText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  function updateField<K extends keyof ImportSession['extractedFields']>(field: K, value: ImportSession['extractedFields'][K]) {
    setSession((current) => markUserEditedField(current, field, value));
  }

  async function handleOcr() {
    const result = await extractOcrSuggestions({ fileName: 'uploaded-image.png', text: ocrText });
    setSession((current) => applyExtractedFields(current, result.fields, result.confidence));
  }

  function handleSave() {
    const validationErrors = validateCorrection(session);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    const fields = session.extractedFields as CorrectedImport;
    onSave(analyzeCorrection(fields, `post-${crypto.randomUUID()}`));
  }

  return (
    <section className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">导入修正</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先补齐信号。</h1>
        <p className="mt-5 max-w-[420px] text-base leading-7 text-muted">自动解析只是起点，保存前由你确认封面、钩子、选题和互动数据。</p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          平台
          <select
            className="rounded-2xl border border-line bg-white px-4 py-3 text-base"
            value={session.extractedFields.sourcePlatform ?? 'unknown'}
            onChange={(event) => updateField('sourcePlatform', event.target.value as SourcePlatform)}
          >
            <option value="unknown">请选择</option>
            <option value="xiaohongshu">小红书</option>
            <option value="wechat">公众号</option>
            <option value="x">X</option>
            <option value="other">其他</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          标题
          <input
            className="rounded-2xl border border-line bg-white px-4 py-3 text-base"
            value={session.extractedFields.title ?? ''}
            onChange={(event) => updateField('title', event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          前三行钩子
          <textarea
            className="min-h-28 rounded-2xl border border-line bg-white px-4 py-3 text-base"
            value={(session.extractedFields.hookLines ?? []).join('\n')}
            onChange={(event) => updateField('hookLines', event.target.value.split('\n').filter(Boolean))}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          选题
          <input
            className="rounded-2xl border border-line bg-white px-4 py-3 text-base"
            value={session.extractedFields.topic ?? ''}
            onChange={(event) => updateField('topic', event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          OCR 文本
          <textarea
            className="min-h-28 rounded-2xl border border-line bg-white px-4 py-3 text-base"
            value={ocrText}
            onChange={(event) => setOcrText(event.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink" type="button" onClick={handleOcr}>
            解析上传内容
          </button>
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white" type="button" onClick={handleSave}>
            保存到收藏
          </button>
        </div>

        {errors.length > 0 ? (
          <div className="rounded-2xl border border-line bg-[#fbfcfa] p-4 text-sm leading-6 text-muted">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create import entry component**

Create `src/features/import/ImportEntry.tsx`:

```tsx
import { useState } from 'react';
import { applyExtractedFields, createImportSession } from '../../domain/importSession';
import type { ImportSession } from '../../domain/types';
import { parseLink } from '../../services/linkImport';

type ImportEntryProps = {
  onSessionReady: (session: ImportSession) => void;
};

export function ImportEntry({ onSessionReady }: ImportEntryProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  async function handleLinkImport() {
    const session = createImportSession({ sourceType: 'link', sourceUrl: url });
    const parsed = await parseLink(url);
    const next = applyExtractedFields(session, parsed.fields, parsed.confidence);
    setError(parsed.errors[0] ?? '');
    onSessionReady({ ...next, parseErrors: parsed.errors });
  }

  function handleManual() {
    onSessionReady(createImportSession({ sourceType: 'manual' }));
  }

  return (
    <section className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.76fr_1.24fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">导入素材</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先把热帖放进来。</h1>
      </div>
      <div className="grid gap-4">
        <input
          aria-label="热帖链接"
          className="rounded-3xl border border-line bg-white px-5 py-4 text-base"
          placeholder="粘贴小红书、公众号或 X 链接"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white" type="button" onClick={handleLinkImport}>
            自动解析
          </button>
          <button className="rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink" type="button" onClick={handleManual}>
            手动录入
          </button>
        </div>
        {error ? <p className="text-sm leading-6 text-muted">{error}</p> : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run component test**

Run:

```bash
npm run test:run -- src/features/import/CorrectionWorkspace.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Wire import route into App**

Modify `src/App.tsx` imports:

```tsx
import type { ImportSession, PostSignal } from './domain/types';
import { ImportEntry } from './features/import/ImportEntry';
import { CorrectionWorkspace } from './features/import/CorrectionWorkspace';
import { useWorkspaceStore } from './state/workspaceStore';
```

Extend the view type:

```tsx
type ViewId = 'landing' | 'today' | 'import' | 'saved' | 'draft' | 'review';
```

Add `import` to visible navigation labels:

```tsx
{ id: 'import', label: '导入' }
```

Add app-level workspace and import session state:

```tsx
const workspace = useWorkspaceStore();
const [importSession, setImportSession] = useState<ImportSession | null>(null);
const [selectedDraftSignal, setSelectedDraftSignal] = useState<PostSignal | undefined>();
```

Add an import save handler:

```tsx
function handleImportedSignal(signal: PostSignal) {
  workspace.savePostSignal(signal);
  setImportSession(null);
  setActiveView('saved');
  window.history.replaceState(null, '', `${window.location.pathname}?view=saved`);
}
```

In the product content selector, route `import` like this:

```tsx
if (activeView === 'import') {
  return importSession ? (
    <CorrectionWorkspace initialSession={importSession} onSave={handleImportedSignal} />
  ) : (
    <ImportEntry onSessionReady={setImportSession} />
  );
}
```

- [ ] **Step 7: Run build and tests**

Run:

```bash
npm run test:run
npm run build
```

Expected: all tests PASS and build exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/features/import/ImportEntry.tsx src/features/import/CorrectionWorkspace.tsx src/features/import/CorrectionWorkspace.test.tsx src/App.tsx
git commit -m "Add import correction workflow"
```

## Task 7: Saved Workspace With Real Data

**Files:**
- Create: `src/features/saved/SavedWorkspace.tsx`
- Test: `src/features/saved/SavedWorkspace.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write saved workspace test**

Create `src/features/saved/SavedWorkspace.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PostSignal } from '../../domain/types';
import { SavedWorkspace } from './SavedWorkspace';

const signal: PostSignal = {
  id: 'post-1',
  sourcePlatform: 'xiaohongshu',
  title: '带具体证据的清单封面',
  coverAssetId: 'asset-1',
  hookLines: ['第一行', '第二行', '第三行'],
  bodySummary: '摘要',
  commentSummary: '评论追问细节',
  topic: '内容流程',
  tags: [],
  metrics: { saves: 120 },
  replicationScore: 86,
  coverSignal: '封面可复用',
  hookSignal: '前三行清晰',
  topicClusterId: 'topic-content',
  commentDemandSignal: '评论需求明确',
  recommendedNextAction: '写标题',
  draftSeed: 'seed',
  status: 'saved',
  createdAt: '2026-05-22T00:00:00.000Z',
  updatedAt: '2026-05-22T00:00:00.000Z',
};

describe('SavedWorkspace', () => {
  it('switches between cover, hook, and topic views', async () => {
    const user = userEvent.setup();
    render(<SavedWorkspace postSignals={[signal]} onDraft={vi.fn()} />);

    expect(screen.getByText('带具体证据的清单封面')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '钩子' }));
    expect(screen.getByText('第一行')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '选题' }));
    expect(screen.getByText('内容流程')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm run test:run -- src/features/saved/SavedWorkspace.test.tsx
```

Expected: FAIL because `SavedWorkspace` does not exist.

- [ ] **Step 3: Extract saved workspace**

Create `src/features/saved/SavedWorkspace.tsx` by moving the current saved-mode concepts from `src/App.tsx` into a real-data component. Preserve these props:

```tsx
import { useState } from 'react';
import { groupTopicClusters } from '../../domain/analysis';
import type { PostSignal } from '../../domain/types';

type SavedMode = 'cover' | 'hook' | 'topic';

type SavedWorkspaceProps = {
  postSignals: PostSignal[];
  onDraft: (signal: PostSignal) => void;
};

export function SavedWorkspace({ postSignals, onDraft }: SavedWorkspaceProps) {
  const [mode, setMode] = useState<SavedMode>('cover');
  const [selected, setSelected] = useState<PostSignal | null>(null);
  const clusters = groupTopicClusters(postSignals);

  if (postSignals.length === 0) {
    return (
      <section className="p-5 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">收藏</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先导入一条热帖。</h1>
      </section>
    );
  }

  return (
    <section className="p-5 sm:p-7">
      <div className="mb-5 flex w-fit rounded-full border border-line bg-white p-1">
        {(['cover', 'hook', 'topic'] as SavedMode[]).map((item) => (
          <button
            aria-pressed={mode === item}
            className={['min-h-9 rounded-full px-4 text-sm transition', mode === item ? 'bg-ink font-semibold text-white' : 'text-muted'].join(' ')}
            key={item}
            onClick={() => setMode(item)}
            type="button"
          >
            {item === 'cover' ? '封面/首图' : item === 'hook' ? '钩子' : '选题'}
          </button>
        ))}
      </div>

      {mode === 'cover' ? (
        <div className="grid auto-rows-[178px] grid-cols-2 gap-4 md:grid-cols-3 md:auto-rows-[190px]">
          {postSignals.map((signal) => (
            <button className="rounded-[28px] border border-line bg-[#fbfcfa] p-5 text-left" key={signal.id} type="button" onClick={() => setSelected(signal)}>
              <span className="text-sm font-bold text-accent">{signal.replicationScore}</span>
              <h2 className="mt-16 text-3xl font-bold leading-none tracking-[-0.055em] text-ink">{signal.title}</h2>
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'hook' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {postSignals.map((signal) => (
            <button className="rounded-[28px] border border-line bg-[#fbfcfa] p-5 text-left" key={signal.id} type="button" onClick={() => setSelected(signal)}>
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-ink">{signal.title}</h2>
              <div className="mt-5 space-y-2 text-sm leading-6 text-muted">
                {signal.hookLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'topic' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clusters.map((cluster) => (
            <article className="rounded-[30px] border border-line bg-[#fbfcfa] p-6" key={cluster.id}>
              <h2 className="text-[34px] font-bold leading-none tracking-[-0.055em] text-ink">{cluster.name}</h2>
              <p className="mt-4 text-sm text-muted">{cluster.postCount} 条</p>
            </article>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/20 px-5 py-7 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="grid w-[min(960px,calc(100vw-40px))] overflow-hidden rounded-[34px] bg-white md:grid-cols-[1fr_1fr_0.9fr]">
            <div className="p-7">
              <p className="text-sm font-bold text-accent">评分 {selected.replicationScore}</p>
              <h2 className="mt-16 text-4xl font-bold leading-none tracking-[-0.055em] text-ink">{selected.title}</h2>
            </div>
            <div className="border-x border-line p-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">内容拆解</p>
              <h3 className="mt-5 text-[38px] font-bold leading-none tracking-[-0.055em] text-ink">{selected.topic}</h3>
              <p className="mt-6 text-base leading-7 text-muted">{selected.hookSignal}</p>
            </div>
            <button className="bg-ink p-7 text-left text-white" type="button" onClick={() => onDraft(selected)}>
              进入起稿页
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run saved workspace test**

Run:

```bash
npm run test:run -- src/features/saved/SavedWorkspace.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Wire real saved data into App**

Modify `src/App.tsx` so the saved route renders:

```tsx
<SavedWorkspace postSignals={workspace.postSignals} onDraft={handleDraftFromSignal} />
```

Add this handler beside `handleImportedSignal`:

```tsx
function handleDraftFromSignal(signal: PostSignal) {
  setSelectedDraftSignal(signal);
  setActiveView('draft');
  window.history.replaceState(null, '', `${window.location.pathname}?view=draft&post=${signal.id}`);
}
```

Seed demo content only through a typed helper:

```tsx
const visiblePostSignals = workspace.postSignals.length > 0 ? workspace.postSignals : demoPostSignals;
```

Then pass `visiblePostSignals` to `SavedWorkspace`:

```tsx
<SavedWorkspace postSignals={visiblePostSignals} onDraft={handleDraftFromSignal} />
```

- [ ] **Step 6: Run full verification**

Run:

```bash
npm run test:run
npm run build
```

Expected: all tests PASS and build exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/features/saved/SavedWorkspace.tsx src/features/saved/SavedWorkspace.test.tsx src/App.tsx
git commit -m "Connect saved workspace to post signals"
```

## Task 8: Draft And Review Workflows

**Files:**
- Create: `src/features/draft/DraftWorkspace.tsx`
- Create: `src/features/review/ReviewWorkspace.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create draft workspace**

Create `src/features/draft/DraftWorkspace.tsx`:

```tsx
import { buildDraftBrief } from '../../domain/analysis';
import type { DraftBrief, PostSignal } from '../../domain/types';

type DraftWorkspaceProps = {
  signal?: PostSignal;
  onSaveBrief: (brief: DraftBrief) => void;
};

export function DraftWorkspace({ signal, onSaveBrief }: DraftWorkspaceProps) {
  if (!signal) {
    return (
      <section className="p-5 sm:p-7">
        <h1 className="text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先选择一条素材。</h1>
      </section>
    );
  }

  const brief = buildDraftBrief(signal, `brief-${signal.id}`);

  return (
    <section className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded-[28px] border border-line bg-[#fbfcfa] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">原始热帖</p>
        <h2 className="mt-8 text-4xl font-bold leading-none tracking-[-0.055em] text-ink">{signal.title}</h2>
      </div>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">从拆解到草稿</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先写标题，不写全文。</h1>
        <div className="mt-8 grid gap-3">
          {brief.titleOptions.map((title) => (
            <div className="rounded-3xl border border-line bg-white p-5 text-lg font-bold tracking-[-0.03em] text-ink" key={title}>
              {title}
            </div>
          ))}
        </div>
        <button className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white" type="button" onClick={() => onSaveBrief(brief)}>
          保存草稿 brief
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create review workspace**

Create `src/features/review/ReviewWorkspace.tsx`:

```tsx
import { useState } from 'react';
import type { ReviewResult, SourcePlatform } from '../../domain/types';

type ReviewWorkspaceProps = {
  postSignalId?: string;
  draftBriefId?: string;
  onSaveReview: (review: ReviewResult) => void;
};

export function ReviewWorkspace({ postSignalId, draftBriefId, onSaveReview }: ReviewWorkspaceProps) {
  const [finalTitle, setFinalTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [platform, setPlatform] = useState<SourcePlatform>('xiaohongshu');

  function handleSave() {
    const createdAt = new Date().toISOString();
    onSaveReview({
      id: `review-${crypto.randomUUID()}`,
      draftBriefId: draftBriefId ?? 'manual-brief',
      postSignalId: postSignalId ?? 'manual-post',
      publishedPlatform: platform,
      publishedAt: createdAt,
      finalTitle,
      metrics: {},
      notes,
      decision: 'continue',
      nextAction: '保留结构，下一轮换角度测试。',
      createdAt,
      updatedAt: createdAt,
    });
  }

  return (
    <section className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[0.72fr_1.28fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">复盘</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">只记录下一步。</h1>
      </div>
      <div className="grid gap-4">
        <select className="rounded-2xl border border-line bg-white px-4 py-3" value={platform} onChange={(event) => setPlatform(event.target.value as SourcePlatform)}>
          <option value="xiaohongshu">小红书</option>
          <option value="wechat">公众号</option>
          <option value="x">X</option>
        </select>
        <input className="rounded-2xl border border-line bg-white px-4 py-3" placeholder="发布后的标题" value={finalTitle} onChange={(event) => setFinalTitle(event.target.value)} />
        <textarea className="min-h-28 rounded-2xl border border-line bg-white px-4 py-3" placeholder="结果记录" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <button className="w-fit rounded-full bg-ink px-5 py-3 text-sm font-bold text-white" type="button" onClick={handleSave}>
          保存复盘
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire draft and review routes**

Modify `src/App.tsx` imports:

```tsx
import { DraftWorkspace } from './features/draft/DraftWorkspace';
import { ReviewWorkspace } from './features/review/ReviewWorkspace';
```

Render the draft route:

```tsx
if (activeView === 'draft') {
  return <DraftWorkspace signal={selectedDraftSignal} onSaveBrief={workspace.saveDraftBrief} />;
}
```

Render the review route:

```tsx
if (activeView === 'review') {
  return (
    <ReviewWorkspace
      postSignalId={selectedDraftSignal?.id}
      draftBriefId={workspace.draftBriefs.find((brief) => brief.postSignalId === selectedDraftSignal?.id)?.id}
      onSaveReview={workspace.saveReviewResult}
    />
  );
}
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run test:run
npm run build
```

Expected: all tests PASS and build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/features/draft/DraftWorkspace.tsx src/features/review/ReviewWorkspace.tsx src/App.tsx
git commit -m "Add draft and review workflows"
```

## Task 9: Screenshots And Final Verification

**Files:**
- Modify: `scripts/capture-design.mjs`
- Update: `design/landing/screenshots/*.png`

- [ ] **Step 1: Add import screenshots**

Modify `scripts/capture-design.mjs`:

```js
const views = ['landing', 'today', 'import', 'saved', 'draft', 'review'];
const savedStates = ['saved-detail', 'saved-hook', 'saved-topic'];
```

Add a correction route capture if the implementation exposes one through query params:

```js
const extraStates = ['import-correction'];
```

Map `import-correction` to:

```js
`${baseUrl}/?view=import&state=correction`
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run test:run
npm run build
npm run design:capture
```

Expected:

- Tests PASS.
- Build exits 0.
- Screenshots are created or updated under `design/landing/screenshots`.

- [ ] **Step 3: Inspect generated screenshots**

Open these files in the Codex image viewer:

- `design/landing/screenshots/import-desktop.png`
- `design/landing/screenshots/import-mobile.png`
- `design/landing/screenshots/saved-desktop.png`
- `design/landing/screenshots/draft-desktop.png`
- `design/landing/screenshots/review-desktop.png`

Expected:

- No horizontal overflow on mobile.
- Import and correction states are visible.
- Saved workspace still has cover, hook, and topic views.
- Draft and review pages use real workspace data.

- [ ] **Step 4: Final commit**

```bash
git add src scripts design package.json package-lock.json vitest.config.ts
git commit -m "Build local MVP workflow vertical slice"
```

Do not stage `.superpowers` companion state files.

## Plan Self-Review

Spec coverage:

- Link import from 小红书, 公众号, and X is covered by Task 4 and Task 6.
- Image OCR import and correction-page image parsing are covered by Task 4 and Task 6.
- Manual correction is covered by Task 3 and Task 6.
- Post signal analysis and scoring are covered by Task 2.
- Saved cover, hook, and topic views are covered by Task 7.
- Detail-to-draft flow is covered by Task 7 and Task 8.
- Review logging is covered by Task 8.
- Screenshot verification is covered by Task 9.

Known execution boundary:

- This first vertical slice uses deterministic service interfaces for link parsing and OCR suggestions. A server-side parser or full OCR provider can replace `src/services/linkImport.ts` and `src/services/ocrImport.ts` without changing feature components.
