import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PostSignal } from '../../domain/types';
import { SavedWorkspace } from './SavedWorkspace';

const signal: PostSignal = {
  id: 'post-1',
  sourcePlatform: 'xiaohongshu',
  title: '带具体证据的清单封面',
  coverAssetId: 'asset-1',
  hookLines: ['第一行', '第二行', '第三行'],
  bodySummary: '摘要',
  commentSummary: '评论追问细节',
  topic: '内容流程',
  tags: [],
  metrics: { saves: 120 },
  replicationScore: 86,
  coverSignal: '封面可复用',
  hookSignal: '前三行清晰',
  topicClusterId: 'topic-content',
  commentDemandSignal: '评论需求明确',
  recommendedNextAction: '写标题',
  draftSeed: 'seed',
  status: 'saved',
  createdAt: '2026-05-22T00:00:00.000Z',
  updatedAt: '2026-05-22T00:00:00.000Z',
};

describe('SavedWorkspace', () => {
  it('switches between cover, hook, and topic views', async () => {
    const user = userEvent.setup();
    render(<SavedWorkspace postSignals={[signal]} onDraft={vi.fn()} />);

    expect(screen.getByText('带具体证据的清单封面')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '钩子' }));
    expect(screen.getByText('第一行')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '选题' }));
    expect(screen.getByText('内容流程')).toBeInTheDocument();
  });

  it('names the detail dialog with the selected post title', async () => {
    const user = userEvent.setup();
    render(<SavedWorkspace postSignals={[signal]} onDraft={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '打开 带具体证据的清单封面' }));

    expect(screen.getByRole('dialog', { name: '带具体证据的清单封面' })).toBeInTheDocument();
  });

  it('focuses the close button and closes the detail dialog with Escape', async () => {
    const user = userEvent.setup();
    render(<SavedWorkspace postSignals={[signal]} onDraft={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '打开 带具体证据的清单封面' }));

    expect(screen.getByRole('button', { name: '关闭' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '带具体证据的清单封面' })).not.toBeInTheDocument();
  });
});
