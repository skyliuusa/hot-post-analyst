import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import type { DraftBrief, PostSignal } from './domain/types';

const storageKey = 'hot-post-analyst.workspace.v1';
const memoryStorage = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    clear: () => memoryStorage.clear(),
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    get length() {
      return memoryStorage.size;
    },
  } satisfies Storage,
});

function postSignal(overrides: Partial<PostSignal> = {}): PostSignal {
  const createdAt = '2026-05-22T00:00:00.000Z';

  return {
    id: 'imported-post-1',
    sourcePlatform: 'xiaohongshu',
    sourceUrl: 'https://example.com/imported-post-1',
    title: 'Imported review signal',
    coverAssetId: 'asset-1',
    hookLines: ['First hook', 'Second hook', 'Third hook'],
    bodySummary: 'A useful post pattern.',
    commentSummary: 'Readers ask for the template.',
    topic: 'Content workflow',
    tags: ['workflow'],
    metrics: { likes: 120, saves: 80, comments: 12 },
    replicationScore: 82,
    coverSignal: 'Clear promise.',
    hookSignal: 'Strong first lines.',
    topicClusterId: 'topic-content-workflow',
    commentDemandSignal: 'Template demand.',
    recommendedNextAction: 'Draft titles.',
    draftSeed: 'Draft seed',
    status: 'saved',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function draftBrief(overrides: Partial<DraftBrief> = {}): DraftBrief {
  const createdAt = '2026-05-22T00:00:00.000Z';

  return {
    id: 'brief-imported-post-1',
    postSignalId: 'imported-post-1',
    titleOptions: ['Title A', 'Title B', 'Title C'],
    coverPromise: 'Show the proof.',
    openingHook: 'Open with the result.',
    outline: ['Why it worked', 'How to adapt it'],
    angleTransformation: 'personalProof',
    status: 'draft',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe('App routing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('restores imported post and draft brief on a direct review URL', async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        postSignals: [postSignal()],
        draftBriefs: [draftBrief()],
        reviewResults: [],
      }),
    );
    window.history.replaceState(null, '', '/?view=review&post=imported-post-1');

    render(<App />);

    expect(await screen.findByRole('button', { name: '保存复盘' })).toBeEnabled();
  });

  it('shows saved-route empty state when no persisted post signals exist', () => {
    window.history.replaceState(null, '', '/?view=saved');

    render(<App />);

    expect(screen.getByRole('heading', { name: '先导入一条热帖。' })).toBeInTheDocument();
    expect(screen.queryByText('小红书爆款拆解')).not.toBeInTheDocument();
  });

  it('uses the primary CTA to enter the import route', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: '开始使用' }));

    expect(window.location.search).toBe('?view=import');
    expect(screen.getByRole('heading', { name: '把热帖变成可复刻信号。' })).toBeInTheDocument();
  });

  it('responds to browser history changes between feature routes', async () => {
    const user = userEvent.setup();

    render(<App />);

    const navigation = screen.getByRole('navigation', { name: '主导航' });
    await user.click(within(navigation).getByRole('button', { name: '导入' }));
    await user.click(within(navigation).getByRole('button', { name: '收藏' }));

    act(() => {
      window.history.pushState(null, '', '/?view=import');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(window.location.search).toBe('?view=import');
    expect(screen.getByRole('heading', { name: '把热帖变成可复刻信号。' })).toBeInTheDocument();

    act(() => {
      window.history.pushState(null, '', '/?view=saved');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(window.location.search).toBe('?view=saved');
    expect(screen.getByRole('heading', { name: '先导入一条热帖。' })).toBeInTheDocument();
  });

  it('restores the saved hook lens from the URL', async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        postSignals: [postSignal({ title: 'Hook route signal' })],
        draftBriefs: [],
        reviewResults: [],
      }),
    );
    window.history.replaceState(null, '', '/?view=saved&mode=hook');

    render(<App />);

    expect(await screen.findByRole('button', { name: '查看 Hook route signal 的钩子拆解' })).toBeInTheDocument();
  });

  it('moves from a saved draft brief to the review route', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        postSignals: [postSignal()],
        draftBriefs: [],
        reviewResults: [],
      }),
    );
    window.history.replaceState(null, '', '/?view=draft&post=imported-post-1');

    render(<App />);

    await user.click(await screen.findByRole('button', { name: '保存草稿 brief' }));

    expect(window.location.search).toBe('?view=review&post=imported-post-1');
    expect(await screen.findByRole('button', { name: '保存复盘' })).toBeEnabled();
  });
});
