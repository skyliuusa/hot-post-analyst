import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createImportSession } from '../../domain/importSession';
import { CorrectionWorkspace } from './CorrectionWorkspace';

describe('CorrectionWorkspace', () => {
  it('keeps user-edited title when OCR suggestions are applied', async () => {
    const user = userEvent.setup();
    const session = createImportSession({ sourceType: 'manual' });
    const onSave = vi.fn();

    render(<CorrectionWorkspace initialSession={session} onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('平台'), 'xiaohongshu');
    await user.type(screen.getByLabelText('标题'), '我自己改过的标题');
    await user.type(screen.getByLabelText('OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '解析上传内容' }));

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
    await user.type(screen.getByLabelText('OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '解析上传内容' }));
    await user.click(screen.getByRole('button', { name: '保存到收藏' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: '我自己改过的标题', topic: '内容流程' }));
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

    await user.type(screen.getByLabelText('OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '解析上传内容' }));

    await waitFor(() =>
      expect(onSessionChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          rawText: '小红书\nOCR 标题\n第一行\n第二行\n第三行',
          extractedFields: expect.objectContaining({
            bodySummary: '小红书\nOCR 标题\n第一行\n第二行\n第三行',
            hookLines: ['第一行', '第二行', '第三行'],
          }),
        }),
      ),
    );
  });
});
