import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReviewWorkspace } from './ReviewWorkspace';

describe('ReviewWorkspace', () => {
  it('saves a review result and shows save feedback', async () => {
    const user = userEvent.setup();
    const onSaveReview = vi.fn();

    render(<ReviewWorkspace draftBriefId="brief-1" onSaveReview={onSaveReview} postSignalId="post-1" />);

    await user.type(screen.getByLabelText('最终标题'), '复盘标题');
    await user.type(screen.getByLabelText('发布时间'), '2026-05-26T12:30');
    await user.type(screen.getByLabelText('浏览'), '1000');
    await user.type(screen.getByLabelText('点赞'), '120');
    await user.type(screen.getByLabelText('收藏'), '80');
    await user.type(screen.getByLabelText('评论'), '12');
    await user.type(screen.getByLabelText('转发'), '6');
    await user.selectOptions(screen.getByLabelText('复盘决策'), 'changeAngle');
    await user.type(screen.getByLabelText('复盘备注'), '这条值得继续验证。');
    await user.click(screen.getByRole('button', { name: '保存复盘' }));

    expect(onSaveReview).toHaveBeenCalledWith(
      expect.objectContaining({
        draftBriefId: 'brief-1',
        finalTitle: '复盘标题',
        metrics: { views: 1000, likes: 120, saves: 80, comments: 12, reposts: 6 },
        notes: '这条值得继续验证。',
        postSignalId: 'post-1',
        publishedAt: '2026-05-26T12:30:00.000Z',
        decision: 'changeAngle',
      }),
    );
    expect(screen.getByText('已保存复盘')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('已保存复盘');
  });

  it('clears save feedback when saved fields change', async () => {
    const user = userEvent.setup();
    const onSaveReview = vi.fn();

    render(<ReviewWorkspace draftBriefId="brief-1" onSaveReview={onSaveReview} postSignalId="post-1" />);

    await user.click(screen.getByRole('button', { name: '保存复盘' }));
    expect(screen.getByRole('status')).toHaveTextContent('已保存复盘');

    await user.type(screen.getByLabelText('最终标题'), '更新标题');

    expect(screen.queryByText('已保存复盘')).not.toBeInTheDocument();
  });
});
