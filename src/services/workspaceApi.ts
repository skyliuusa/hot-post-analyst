import type { DraftBrief, PostSignal, ReviewResult } from '../domain/types';

export type WorkspaceData = {
  postSignals: PostSignal[];
  draftBriefs: DraftBrief[];
  reviewResults: ReviewResult[];
};

export type WorkspaceCollection = keyof WorkspaceData;

type WorkspaceItem = PostSignal | DraftBrief | ReviewResult;

function canUseFetch() {
  return typeof fetch === 'function';
}

export async function loadWorkspaceFromApi(): Promise<unknown | null> {
  if (!canUseFetch()) return null;

  try {
    const response = await fetch('/api/workspace', { method: 'GET' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function saveWorkspaceItemToApi(collection: WorkspaceCollection, item: WorkspaceItem): Promise<boolean> {
  if (!canUseFetch()) return false;

  try {
    const response = await fetch(`/api/workspace/${collection}/${encodeURIComponent(item.id)}`, {
      body: JSON.stringify(item),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    });
    return response.ok;
  } catch {
    return false;
  }
}
