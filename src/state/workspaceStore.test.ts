import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readJson } from '../services/storage';
import type { DraftBrief, PostSignal, ReviewResult } from '../domain/types';
import { useWorkspaceStore } from './workspaceStore';

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

const localStorage = window.localStorage;

function postSignal(overrides: Partial<PostSignal> = {}): PostSignal {
  const createdAt = '2026-05-22T00:00:00.000Z';

  return {
    id: 'post-1',
    sourcePlatform: 'xiaohongshu',
    sourceUrl: 'https://example.com/post-1',
    title: 'First saved signal',
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
    id: 'brief-1',
    postSignalId: 'post-1',
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

function reviewResult(overrides: Partial<ReviewResult> = {}): ReviewResult {
  const createdAt = '2026-05-22T00:00:00.000Z';

  return {
    id: 'review-1',
    draftBriefId: 'brief-1',
    postSignalId: 'post-1',
    publishedPlatform: 'xiaohongshu',
    publishedAt: createdAt,
    finalTitle: 'Published title',
    metrics: { likes: 20, saves: 8, comments: 3 },
    notes: 'Keep the angle.',
    decision: 'continue',
    nextAction: 'Publish another variation.',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists saved post signals to localStorage and reloads them on rerender', () => {
    const signal = postSignal({ title: 'Saved signal title' });
    const { result, rerender } = renderHook(() => useWorkspaceStore());

    act(() => {
      result.current.savePostSignal(signal);
    });
    rerender();

    expect(result.current.postSignals.map((item) => item.title)).toContain('Saved signal title');
  });

  it('orders saved entities newest-first and moves replacements to the front', () => {
    const { result } = renderHook(() => useWorkspaceStore());

    act(() => {
      result.current.savePostSignal(postSignal({ id: 'post-1', title: 'First post' }));
      result.current.savePostSignal(postSignal({ id: 'post-2', title: 'Second post' }));
      result.current.savePostSignal(postSignal({ id: 'post-3', title: 'Third post' }));
      result.current.savePostSignal(postSignal({ id: 'post-2', title: 'Updated second post' }));
      result.current.saveDraftBrief(draftBrief({ id: 'brief-1', coverPromise: 'First promise' }));
      result.current.saveDraftBrief(draftBrief({ id: 'brief-2', coverPromise: 'Second promise' }));
      result.current.saveDraftBrief(draftBrief({ id: 'brief-3', coverPromise: 'Third promise' }));
      result.current.saveDraftBrief(draftBrief({ id: 'brief-2', coverPromise: 'Updated second promise' }));
      result.current.saveReviewResult(reviewResult({ id: 'review-1', nextAction: 'First action' }));
      result.current.saveReviewResult(reviewResult({ id: 'review-2', nextAction: 'Second action' }));
      result.current.saveReviewResult(reviewResult({ id: 'review-3', nextAction: 'Third action' }));
      result.current.saveReviewResult(reviewResult({ id: 'review-2', nextAction: 'Updated second action' }));
    });

    expect(result.current.postSignals.map((item) => item.title)).toEqual(['Updated second post', 'Third post', 'First post']);
    expect(result.current.draftBriefs.map((item) => item.coverPromise)).toEqual([
      'Updated second promise',
      'Third promise',
      'First promise',
    ]);
    expect(result.current.reviewResults.map((item) => item.nextAction)).toEqual([
      'Updated second action',
      'Third action',
      'First action',
    ]);
  });

  it('normalizes malformed workspace JSON before saving', () => {
    localStorage.setItem(storageKey, JSON.stringify({}));
    const { result } = renderHook(() => useWorkspaceStore());

    act(() => {
      result.current.savePostSignal(postSignal({ title: 'Recovered signal' }));
    });

    expect(result.current.postSignals.map((item) => item.title)).toEqual(['Recovered signal']);
    expect(result.current.draftBriefs).toEqual([]);
    expect(result.current.reviewResults).toEqual([]);
  });

  it('filters malformed persisted array entries during hydration', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        postSignals: [{}, postSignal({ id: 'post-valid', title: 'Valid signal' })],
        draftBriefs: [{}, draftBrief({ id: 'brief-valid', coverPromise: 'Valid promise' })],
        reviewResults: [{}, reviewResult({ id: 'review-valid', nextAction: 'Valid action' })],
      }),
    );

    const { result } = renderHook(() => useWorkspaceStore());

    expect(result.current.postSignals.map((item) => item.title)).toEqual(['Valid signal']);
    expect(result.current.draftBriefs.map((item) => item.coverPromise)).toEqual(['Valid promise']);
    expect(result.current.reviewResults.map((item) => item.nextAction)).toEqual(['Valid action']);
  });

  it('keeps in-memory state when localStorage writes fail', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    const { result } = renderHook(() => useWorkspaceStore());

    act(() => {
      result.current.savePostSignal(postSignal({ title: 'Unsynced signal' }));
    });

    expect(result.current.postSignals.map((item) => item.title)).toEqual(['Unsynced signal']);
  });
});

describe('readJson', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when stored JSON is invalid', () => {
    localStorage.setItem(storageKey, '{invalid');

    expect(readJson(storageKey, { postSignals: ['fallback'] })).toEqual({ postSignals: ['fallback'] });
  });
});
