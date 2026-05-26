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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isPostSignal(value: unknown): value is PostSignal {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    isStringArray(value.hookLines) &&
    typeof value.topic === 'string' &&
    typeof value.replicationScore === 'number' &&
    typeof value.coverSignal === 'string' &&
    typeof value.hookSignal === 'string' &&
    typeof value.topicClusterId === 'string' &&
    typeof value.commentDemandSignal === 'string' &&
    typeof value.recommendedNextAction === 'string' &&
    typeof value.draftSeed === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isDraftBrief(value: unknown): value is DraftBrief {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.postSignalId === 'string' &&
    isStringArray(value.titleOptions) &&
    typeof value.coverPromise === 'string' &&
    typeof value.openingHook === 'string' &&
    isStringArray(value.outline) &&
    typeof value.status === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isReviewResult(value: unknown): value is ReviewResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.draftBriefId === 'string' &&
    typeof value.postSignalId === 'string' &&
    typeof value.publishedAt === 'string' &&
    typeof value.finalTitle === 'string' &&
    typeof value.notes === 'string' &&
    typeof value.decision === 'string' &&
    typeof value.nextAction === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function normalizeWorkspace(value: unknown): WorkspaceData {
  if (!value || typeof value !== 'object') {
    return emptyWorkspace;
  }

  const candidate = value as Partial<WorkspaceData>;

  return {
    postSignals: Array.isArray(candidate.postSignals) ? candidate.postSignals.filter(isPostSignal) : [],
    draftBriefs: Array.isArray(candidate.draftBriefs) ? candidate.draftBriefs.filter(isDraftBrief) : [],
    reviewResults: Array.isArray(candidate.reviewResults) ? candidate.reviewResults.filter(isReviewResult) : [],
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
