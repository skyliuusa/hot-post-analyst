import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createImportSession } from '../../domain/importSession';
import { CorrectionWorkspace } from './CorrectionWorkspace';

describe('CorrectionWorkspace', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => `blob://uploaded/${file.name}`),
    });
  });

  it('keeps user-edited title when OCR suggestions are applied', async () => {
    const user = userEvent.setup();
    const session = createImportSession({ sourceType: 'manual' });
    const onSave = vi.fn();

    render(<CorrectionWorkspace initialSession={session} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('平台'), 'xiaohongshu');
    await user.type(screen.getByLabelText('标题'), '我自己改过的标题');
    await user.clear(screen.getByLabelText('图片/OCR 文件名'));
    await user.type(screen.getByLabelText('图片/OCR 文件名'), 'cover.png');
    await user.type(screen.getByLabelText('图片/OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '添加图片/OCR' }));

    expect(screen.getByLabelText('标题')).toHaveValue('我自己改过的标题');
    expect(screen.getByLabelText('前三行钩子')).toHaveValue('第一行\n第二行\n第三行');
  });

  it('saves a manual OCR session after required correction fields are filled', async () => {
    const user = userEvent.setup();
    const session = createImportSession({ sourceType: 'manual' });
    const onSave = vi.fn();

    render(<CorrectionWorkspace initialSession={session} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('平台'), 'xiaohongshu');
    await user.type(screen.getByLabelText('标题'), '我自己改过的标题');
    await user.type(screen.getByLabelText('选题'), '内容流程');
    await user.clear(screen.getByLabelText('图片/OCR 文件名'));
    await user.type(screen.getByLabelText('图片/OCR 文件名'), 'cover.png');
    await user.type(screen.getByLabelText('图片/OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '添加图片/OCR' }));
    await user.click(screen.getByRole('button', { name: '保存到收藏' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ coverAssetId: expect.any(String), title: '我自己改过的标题', topic: '内容流程' }));
  });

  it('reports session changes after field edits and OCR parsing', async () => {
    const user = userEvent.setup();
    const session = createImportSession({ sourceType: 'manual' });
    const onSessionChange = vi.fn();

    render(<CorrectionWorkspace initialSession={session} onSave={vi.fn()} onSessionChange={onSessionChange} />);

    await user.selectOptions(screen.getByLabelText('平台'), 'xiaohongshu');
    expect(onSessionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        extractedFields: expect.objectContaining({ sourcePlatform: 'xiaohongshu' }),
      }),
    );

    await user.clear(screen.getByLabelText('图片/OCR 文件名'));
    await user.type(screen.getByLabelText('图片/OCR 文件名'), 'cover.png');
    await user.type(screen.getByLabelText('图片/OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '添加图片/OCR' }));

    await waitFor(() =>
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          rawText: '小红书\nOCR 标题\n第一行\n第二行\n第三行',
          uploadedAssets: [expect.objectContaining({ fileUrl: 'local://cover.png', type: 'cover' })],
          extractedFields: expect.objectContaining({
            bodySummary: '小红书\nOCR 标题\n第一行\n第二行\n第三行',
            hookLines: ['第一行', '第二行', '第三行'],
          }),
        }),
      ),
    );
  });

  it('uploads image files and stores them as imported assets during correction', async () => {
    const user = userEvent.setup();
    const session = createImportSession({ sourceType: 'manual' });
    const onSessionChange = vi.fn();
    const cover = new File(['cover'], 'cover.png', { type: 'image/png' });
    const comments = new File(['comments'], 'comments.png', { type: 'image/png' });

    render(<CorrectionWorkspace initialSession={session} onSave={vi.fn()} onSessionChange={onSessionChange} />);

    await user.upload(screen.getByLabelText('上传图片'), [cover, comments]);
    await user.type(screen.getByLabelText('图片/OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '添加图片/OCR' }));

    await waitFor(() =>
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          uploadedAssets: [
            expect.objectContaining({ fileUrl: 'blob://uploaded/cover.png', isSelectedCover: true, type: 'cover' }),
            expect.objectContaining({ fileUrl: 'blob://uploaded/comments.png', type: 'commentScreenshot' }),
          ],
        }),
      ),
    );
  });

  it('edits original URL summaries metrics tags and notes before save', async () => {
    const user = userEvent.setup();
    const session = createImportSession({ sourceType: 'manual' });
    const onSave = vi.fn();

    render(<CorrectionWorkspace initialSession={session} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('平台'), 'x');
    await user.type(screen.getByLabelText('原始链接'), 'https://x.com/user/status/1');
    await user.type(screen.getByLabelText('标题'), '标题');
    await user.type(screen.getByLabelText('前三行钩子'), '第一行');
    await user.type(screen.getByLabelText('正文摘要'), '正文摘要');
    await user.type(screen.getByLabelText('评论摘要'), '评论追问模板');
    await user.type(screen.getByLabelText('点赞'), '12');
    await user.type(screen.getByLabelText('收藏'), '8');
    await user.type(screen.getByLabelText('评论'), '3');
    await user.type(screen.getByLabelText('转发'), '2');
    await user.type(screen.getByLabelText('浏览'), '100');
    fireEvent.change(screen.getByLabelText('标签'), { target: { value: '模板,流程' } });
    await user.type(screen.getByLabelText('备注'), '优先复刻');
    await user.click(screen.getByRole('button', { name: '保存到收藏' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: 'https://x.com/user/status/1',
        bodySummary: '正文摘要',
        commentSummary: '评论追问模板',
        metrics: { likes: 12, saves: 8, comments: 3, reposts: 2, views: 100 },
        tags: ['模板', '流程'],
      }),
    );
  });
});
