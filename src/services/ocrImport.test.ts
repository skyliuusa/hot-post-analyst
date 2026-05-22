import { describe, expect, it } from 'vitest';
import { extractOcrSuggestions } from './ocrImport';

describe('extractOcrSuggestions', () => {
  it('marks 小红书 when OCR text contains platform hints', async () => {
    const result = await extractOcrSuggestions({
      fileName: 'cover.png',
      text: '小红书 赞 收藏 评论\n带具体证据的清单封面\n我把一套内容流程跑了 21 天。\n真正有效的不是灵感。',
    });

    expect(result.fields.sourcePlatform).toBe('xiaohongshu');
    expect(result.fields.title).toBe('带具体证据的清单封面');
    expect(result.fields.hookLines?.[0]).toBe('我把一套内容流程跑了 21 天。');
    expect(result.assetType).toBe('cover');
  });

  it('detects comment and content screenshots from filename or OCR hints', async () => {
    await expect(extractOcrSuggestions({ fileName: 'comments.png', text: '用户评论\n求流程' })).resolves.toMatchObject({
      assetType: 'commentScreenshot',
    });
    await expect(extractOcrSuggestions({ fileName: 'body.png', text: '正文内容\n步骤一' })).resolves.toMatchObject({
      assetType: 'contentScreenshot',
    });
  });

  it('does not infer 小红书 from generic engagement words alone', async () => {
    const result = await extractOcrSuggestions({
      fileName: 'cover.png',
      text: '评论区都在追问执行清单\n赞同的人通常先收藏\n阅读完再复盘。',
    });

    expect(result.fields.sourcePlatform).toBe('unknown');
    expect(result.fields.title).toBe('评论区都在追问执行清单');
    expect(result.fields.hookLines?.[0]).toBe('赞同的人通常先收藏');
  });

  it('keeps real content lines that contain engagement words', async () => {
    const result = await extractOcrSuggestions({
      fileName: 'cover.png',
      text: '小红书\n带具体证据的清单封面\n评论区都在追问执行清单\n阅读完再复盘。',
    });

    expect(result.fields.title).toBe('带具体证据的清单封面');
    expect(result.fields.hookLines).toEqual(['评论区都在追问执行清单', '阅读完再复盘。']);
  });

  it('omits absent hook and topic confidence when OCR text has no content suggestions', async () => {
    const result = await extractOcrSuggestions({
      fileName: 'empty.png',
      text: '',
    });

    expect(result.fields.hookLines).toBeUndefined();
    expect(result.fields.topic).toBeUndefined();
    expect(result.confidence.hookLines).toBeUndefined();
    expect(result.confidence.topic).toBeUndefined();
  });
});
