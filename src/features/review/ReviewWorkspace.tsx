import { useState } from 'react';
import type { EngagementMetrics, ReviewDecision, ReviewResult, SourcePlatform } from '../../domain/types';

type ReviewWorkspaceProps = {
  postSignalId?: string;
  draftBriefId?: string;
  onSaveReview: (review: ReviewResult) => void;
};

const platforms: Array<{ id: SourcePlatform; label: string }> = [
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'wechat', label: '公众号' },
  { id: 'x', label: 'X' },
  { id: 'other', label: '其他' },
];

const decisions: Array<{ id: ReviewDecision; label: string }> = [
  { id: 'continue', label: '继续复刻' },
  { id: 'changeAngle', label: '换角度' },
  { id: 'discard', label: '丢弃' },
];

function nowIso() {
  return new Date().toISOString();
}

function parseOptionalMetric(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function metricValue(metrics: EngagementMetrics, key: keyof EngagementMetrics) {
  return metrics[key] ?? '';
}

function publishedInputToIso(value: string) {
  if (!value) return nowIso();
  const withSeconds = value.length === 16 ? `${value}:00.000Z` : `${value}.000Z`;
  return new Date(withSeconds).toISOString();
}

export function ReviewWorkspace({ draftBriefId, onSaveReview, postSignalId }: ReviewWorkspaceProps) {
  const [publishedPlatform, setPublishedPlatform] = useState<SourcePlatform>('xiaohongshu');
  const [publishedAt, setPublishedAt] = useState('');
  const [finalTitle, setFinalTitle] = useState('');
  const [metrics, setMetrics] = useState<EngagementMetrics>({});
  const [decision, setDecision] = useState<ReviewDecision>('continue');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('保留当前结构，继续做下一版标题和封面证据。');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const canSave = Boolean(postSignalId && draftBriefId);

  function handleSaveReview() {
    if (!postSignalId || !draftBriefId) return;

    const createdAt = nowIso();
    onSaveReview({
      id: `review-${draftBriefId}`,
      draftBriefId,
      postSignalId,
      publishedPlatform,
      publishedAt: publishedInputToIso(publishedAt),
      finalTitle: finalTitle.trim() || '未填写标题',
      metrics,
      notes: notes.trim(),
      decision,
      nextAction: nextAction.trim() || '继续复刻当前选题。',
      createdAt,
      updatedAt: createdAt,
    });
    setSavedAt(createdAt);
  }

  function markUnsaved() {
    if (savedAt) setSavedAt(null);
  }

  function handleMetricChange(key: keyof EngagementMetrics, value: string) {
    markUnsaved();
    setMetrics((current) => {
      const next = { ...current };
      const parsed = parseOptionalMetric(value);
      if (parsed === undefined) {
        delete next[key];
      } else {
        next[key] = parsed;
      }
      return next;
    });
  }

  return (
    <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[0.72fr_1.28fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">复盘只看关键反馈</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">这次复刻值得继续。</h1>
        <p className="mt-5 max-w-[380px] text-base leading-7 text-muted">保存草稿后记录发布平台、最终标题和下一轮动作，形成从素材到复盘的闭环。</p>
        {!canSave ? <p className="mt-6 rounded-[22px] border border-line bg-[#fbfcfa] p-4 text-sm leading-6 text-muted">先保存草稿 brief 后再复盘。</p> : null}
      </div>

      <div className="grid gap-4 rounded-[28px] border border-line bg-[#fbfcfa] p-5 sm:p-6">
        <label className="grid gap-2 text-sm font-bold text-ink">
          发布平台
          <select
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => {
              markUnsaved();
              setPublishedPlatform(event.target.value as SourcePlatform);
            }}
            value={publishedPlatform}
          >
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          最终标题
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => {
              markUnsaved();
              setFinalTitle(event.target.value);
            }}
            placeholder="填写实际发布标题"
            type="text"
            value={finalTitle}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          发布时间
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => {
              markUnsaved();
              setPublishedAt(event.target.value);
            }}
            type="datetime-local"
            value={publishedAt}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['views', '浏览'],
            ['likes', '点赞'],
            ['saves', '收藏'],
            ['comments', '评论'],
            ['reposts', '转发'],
          ].map(([key, label]) => (
            <label className="grid min-w-0 gap-2 text-sm font-bold text-ink" key={key}>
              {label}
              <input
                className="min-h-12 w-full min-w-0 rounded-[18px] border border-line bg-white px-3 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                min="0"
                onChange={(event) => handleMetricChange(key as keyof EngagementMetrics, event.target.value)}
                type="number"
                value={metricValue(metrics, key as keyof EngagementMetrics)}
              />
            </label>
          ))}
        </div>

        <label className="grid gap-2 text-sm font-bold text-ink">
          复盘决策
          <select
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => {
              markUnsaved();
              setDecision(event.target.value as ReviewDecision);
            }}
            value={decision}
          >
            {decisions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          复盘备注
          <textarea
            className="min-h-28 resize-y rounded-[18px] border border-line bg-white px-4 py-3 text-base font-medium leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => {
              markUnsaved();
              setNotes(event.target.value);
            }}
            placeholder="记录保存、评论或选题反馈"
            value={notes}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          下一轮动作
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => {
              markUnsaved();
              setNextAction(event.target.value);
            }}
            type="text"
            value={nextAction}
          />
        </label>

        <button
          className="min-h-12 rounded-full bg-ink px-6 text-sm font-bold text-white transition active:translate-y-px disabled:cursor-not-allowed disabled:bg-soft"
          disabled={!canSave}
          onClick={handleSaveReview}
          type="button"
        >
          保存复盘
        </button>
        {savedAt ? (
          <p aria-live="polite" className="text-center text-sm font-bold text-accent" role="status">
            已保存复盘
          </p>
        ) : null}
      </div>
    </div>
  );
}
