import { useCallback, useState } from 'react';
import type { DraftBrief, PostSignal, ReviewResult } from '../domain/types';
import { readJson, writeJson } from '../services/storage';

const workspaceStorageKey = 'hot-post-analyst.workspace.v1';

type WorkspaceData = {
  postSignals: PostSignal[];
  draftBriefs: DraftBrief[];
  reviewResults: ReviewResult[];
};

type WorkspaceStore = WorkspaceData & {
  savePostSignal: (postSignal: PostSignal) => void;
  saveDraftBrief: (draftBrief: DraftBrief) => void;
  saveReviewResult: (reviewResult: ReviewResult) => void;
};

const emptyWorkspace: WorkspaceData = {
  postSignals: [],
  draftBriefs: [],
  reviewResults: [],
};

function replaceById<T extends { id: string }>(items: T[], nextItem: T) {
  const itemIndex = items.findIndex((item) => item.id === nextItem.id);

  if (itemIndex === -1) {
    return [...items, nextItem];
  }

  return items.map((item, index) => (index === itemIndex ? nextItem : item));
}

function readWorkspace() {
  return readJson<WorkspaceData>(workspaceStorageKey, emptyWorkspace);
}

export function useWorkspaceStore(): WorkspaceStore {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => readWorkspace());

  const updateWorkspace = useCallback((buildNext: (current: WorkspaceData) => WorkspaceData) => {
    setWorkspace((current) => {
      const next = buildNext(current);
      writeJson(workspaceStorageKey, next);
      return next;
    });
  }, []);

  const savePostSignal = useCallback(
    (postSignal: PostSignal) => {
      updateWorkspace((current) => ({
        ...current,
        postSignals: replaceById(current.postSignals, postSignal),
      }));
    },
    [updateWorkspace],
  );

  const saveDraftBrief = useCallback(
    (draftBrief: DraftBrief) => {
      updateWorkspace((current) => ({
        ...current,
        draftBriefs: replaceById(current.draftBriefs, draftBrief),
      }));
    },
    [updateWorkspace],
  );

  const saveReviewResult = useCallback(
    (reviewResult: ReviewResult) => {
      updateWorkspace((current) => ({
        ...current,
        reviewResults: replaceById(current.reviewResults, reviewResult),
      }));
    },
    [updateWorkspace],
  );

  return {
    ...workspace,
    savePostSignal,
    saveDraftBrief,
    saveReviewResult,
  };
}
