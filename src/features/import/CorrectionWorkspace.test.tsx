import { render, screen } from '@testing-library/react';
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
});
