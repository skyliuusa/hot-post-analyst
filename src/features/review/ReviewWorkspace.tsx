import { useState } from 'react';
import type { ReviewResult, SourcePlatform } from '../../domain/types';

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

function nowIso() {
  return new Date().toISOString();
}

export function ReviewWorkspace({ draftBriefId, onSaveReview, postSignalId }: ReviewWorkspaceProps) {
  const [publishedPlatform, setPublishedPlatform] = useState<SourcePlatform>('xiaohongshu');
  const [finalTitle, setFinalTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('保留当前结构，继续做下一版标题和封面证据。');
  const canSave = Boolean(postSignalId && draftBriefId);

  function handleSaveReview() {
    if (!postSignalId || !draftBriefId) return;

    const createdAt = nowIso();
    onSaveReview({
      id: `review-${draftBriefId}`,
      draftBriefId,
      postSignalId,
      publishedPlatform,
      publishedAt: createdAt,
      finalTitle: finalTitle.trim() || '未填写标题',
      metrics: {},
      notes: notes.trim(),
      decision: 'continue',
      nextAction: nextAction.trim() || '继续复刻当前选题。',
      createdAt,
      updatedAt: createdAt,
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
            onChange={(event) => setPublishedPlatform(event.target.value as SourcePlatform)}
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
            onChange={(event) => setFinalTitle(event.target.value)}
            placeholder="填写实际发布标题"
            type="text"
            value={finalTitle}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          复盘备注
          <textarea
            className="min-h-28 resize-y rounded-[18px] border border-line bg-white px-4 py-3 text-base font-medium leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="记录保存、评论或选题反馈"
            value={notes}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          下一轮动作
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => setNextAction(event.target.value)}
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
      </div>
    </div>
  );
}
