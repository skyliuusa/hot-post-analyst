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
