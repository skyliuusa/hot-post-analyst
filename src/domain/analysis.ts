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
      '别直接照搬，先改这一个结构',
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
