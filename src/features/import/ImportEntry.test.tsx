import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportEntry } from './ImportEntry';

describe('ImportEntry', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((file: File) => `blob://uploaded/${file.name}`),
    });
  });

  it('starts an image import from uploaded files and OCR text', async () => {
    const user = userEvent.setup();
    const onSessionReady = vi.fn();
    const cover = new File(['cover'], 'cover.png', { type: 'image/png' });
    const body = new File(['body'], 'body.png', { type: 'image/png' });

    render(<ImportEntry onSessionReady={onSessionReady} />);

    await user.upload(screen.getByLabelText('上传图片'), [cover, body]);
    await user.type(screen.getByLabelText('图片/OCR 文本'), '小红书\nOCR 标题\n第一行\n第二行\n第三行');
    await user.click(screen.getByRole('button', { name: '图片/OCR 导入' }));

    await waitFor(() =>
      expect(onSessionReady).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceType: 'image',
          uploadedAssets: [
            expect.objectContaining({ fileUrl: 'blob://uploaded/cover.png', isSelectedCover: true, type: 'cover' }),
            expect.objectContaining({ fileUrl: 'blob://uploaded/body.png', type: 'contentScreenshot' }),
          ],
          extractedFields: expect.objectContaining({
            sourcePlatform: 'xiaohongshu',
            title: 'OCR 标题',
            hookLines: ['第一行', '第二行', '第三行'],
          }),
        }),
      ),
    );
  });
});
