import { useCallback, useEffect, useRef, useState } from 'react';
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

function saveNewestFirst<T extends { id: string }>(items: T[], nextItem: T) {
  return [nextItem, ...items.filter((item) => item.id !== nextItem.id)];
}

function normalizeWorkspace(value: unknown): WorkspaceData {
  if (!value || typeof value !== 'object') {
    return emptyWorkspace;
  }

  const candidate = value as Partial<WorkspaceData>;

  return {
    postSignals: Array.isArray(candidate.postSignals) ? candidate.postSignals : [],
    draftBriefs: Array.isArray(candidate.draftBriefs) ? candidate.draftBriefs : [],
    reviewResults: Array.isArray(candidate.reviewResults) ? candidate.reviewResults : [],
  };
}

function readWorkspace() {
  return normalizeWorkspace(readJson<unknown>(workspaceStorageKey, emptyWorkspace));
}

export function useWorkspaceStore(): WorkspaceStore {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => readWorkspace());
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    writeJson(workspaceStorageKey, workspace);
  }, [workspace]);

  const updateWorkspace = useCallback((buildNext: (current: WorkspaceData) => WorkspaceData) => {
    setWorkspace((current) => buildNext(current));
  }, []);

  const savePostSignal = useCallback(
    (postSignal: PostSignal) => {
      updateWorkspace((current) => ({
        ...current,
        postSignals: saveNewestFirst(current.postSignals, postSignal),
      }));
    },
    [updateWorkspace],
  );

  const saveDraftBrief = useCallback(
    (draftBrief: DraftBrief) => {
      updateWorkspace((current) => ({
        ...current,
        draftBriefs: saveNewestFirst(current.draftBriefs, draftBrief),
      }));
    },
    [updateWorkspace],
  );

  const saveReviewResult = useCallback(
    (reviewResult: ReviewResult) => {
      updateWorkspace((current) => ({
        ...current,
        reviewResults: saveNewestFirst(current.reviewResults, reviewResult),
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
