import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createWorkspaceRepository } from './workspaceRepository.mjs';

let tempDir;

function postSignal(overrides = {}) {
  return {
    id: 'post-1',
    title: 'Saved signal',
    updatedAt: '2026-05-22T00:00:00.000Z',
    ...overrides,
  };
}

function draftBrief(overrides = {}) {
  return {
    id: 'brief-1',
    postSignalId: 'post-1',
    updatedAt: '2026-05-22T00:01:00.000Z',
    ...overrides,
  };
}

function reviewResult(overrides = {}) {
  return {
    id: 'review-1',
    draftBriefId: 'brief-1',
    postSignalId: 'post-1',
    updatedAt: '2026-05-22T00:02:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'hpa-sqlite-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('createWorkspaceRepository', () => {
  it('saves and loads workspace collections newest-first', () => {
    const repository = createWorkspaceRepository(join(tempDir, 'workspace.sqlite'));

    repository.saveItem('postSignals', postSignal({ id: 'post-old', title: 'Old post', updatedAt: '2026-05-22T00:00:00.000Z' }));
    repository.saveItem('postSignals', postSignal({ id: 'post-new', title: 'New post', updatedAt: '2026-05-22T00:03:00.000Z' }));
    repository.saveItem('draftBriefs', draftBrief({ id: 'brief-1' }));
    repository.saveItem('reviewResults', reviewResult({ id: 'review-1' }));

    assert.deepEqual(repository.loadWorkspace(), {
      postSignals: [
        postSignal({ id: 'post-new', title: 'New post', updatedAt: '2026-05-22T00:03:00.000Z' }),
        postSignal({ id: 'post-old', title: 'Old post', updatedAt: '2026-05-22T00:00:00.000Z' }),
      ],
      draftBriefs: [draftBrief({ id: 'brief-1' })],
      reviewResults: [reviewResult({ id: 'review-1' })],
    });
  });

  it('replaces existing records with the same id', () => {
    const repository = createWorkspaceRepository(join(tempDir, 'workspace.sqlite'));

    repository.saveItem('postSignals', postSignal({ id: 'post-1', title: 'First title' }));
    repository.saveItem('postSignals', postSignal({ id: 'post-1', title: 'Updated title', updatedAt: '2026-05-22T00:04:00.000Z' }));

    assert.deepEqual(repository.loadWorkspace().postSignals, [
      postSignal({ id: 'post-1', title: 'Updated title', updatedAt: '2026-05-22T00:04:00.000Z' }),
    ]);
  });

  it('rejects unknown collections', () => {
    const repository = createWorkspaceRepository(join(tempDir, 'workspace.sqlite'));

    assert.throws(() => repository.saveItem('unknown', postSignal()), /Unknown workspace collection/);
  });
});
