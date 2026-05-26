import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PostSignal } from '../../domain/types';
import { DraftWorkspace } from './DraftWorkspace';

const signal: PostSignal = {
  id: 'post-1',
  sourcePlatform: 'xiaohongshu',
  sourceUrl: 'https://example.com/post-1',
  title: '带具体证据的清单封面',
  coverAssetId: 'asset-1',
  hookLines: ['第一行', '第二行', '第三行'],
  bodySummary: '摘要',
  commentSummary: '评论追问细节',
  topic: '内容流程',
  tags: ['流程'],
  metrics: { likes: 120, saves: 80, comments: 12 },
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

describe('DraftWorkspace', () => {
  it('renders and saves manually edited brief fields including outline', async () => {
    const user = userEvent.setup();
    const onSaveBrief = vi.fn();

    render(<DraftWorkspace signal={signal} onSaveBrief={onSaveBrief} />);

    fireEvent.change(screen.getByLabelText('标题选项'), { target: { value: '标题 A\n标题 B' } });
    fireEvent.change(screen.getByLabelText('封面承诺'), { target: { value: '封面新承诺' } });
    fireEvent.change(screen.getByLabelText('开头结构'), { target: { value: '新的开头' } });
    fireEvent.change(screen.getByLabelText('大纲'), { target: { value: '第一段\n第二段' } });
    await user.click(screen.getByRole('button', { name: '保存草稿 brief' }));

    expect(onSaveBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        titleOptions: ['标题 A', '标题 B'],
        coverPromise: '封面新承诺',
        openingHook: '新的开头',
        outline: ['第一段', '第二段'],
        status: 'draft',
      }),
    );
  });

  it('regenerates title options only and opening only', async () => {
    const user = userEvent.setup();

    render(<DraftWorkspace signal={signal} onSaveBrief={vi.fn()} />);

    await user.clear(screen.getByLabelText('标题选项'));
    await user.type(screen.getByLabelText('标题选项'), '自定义标题');
    await user.clear(screen.getByLabelText('开头结构'));
    await user.type(screen.getByLabelText('开头结构'), '自定义开头');

    await user.click(screen.getByRole('button', { name: '重生成标题' }));
    expect(screen.getByLabelText('标题选项')).not.toHaveValue('自定义标题');
    expect(screen.getByLabelText('开头结构')).toHaveValue('自定义开头');

    await user.click(screen.getByRole('button', { name: '重生成开头' }));
    expect(screen.getByLabelText('开头结构')).not.toHaveValue('自定义开头');
  });

  it('can mark a brief used or discarded before saving', async () => {
    const user = userEvent.setup();
    const onSaveBrief = vi.fn();

    render(<DraftWorkspace signal={signal} onSaveBrief={onSaveBrief} />);

    await user.click(screen.getByRole('button', { name: '标记已使用' }));
    await user.click(screen.getByRole('button', { name: '保存草稿 brief' }));
    expect(onSaveBrief).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'used' }));

    await user.click(screen.getByRole('button', { name: '标记放弃' }));
    await user.click(screen.getByRole('button', { name: '保存草稿 brief' }));
    expect(onSaveBrief).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'discarded' }));
  });
});
