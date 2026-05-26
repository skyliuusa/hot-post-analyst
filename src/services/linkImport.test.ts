import { describe, expect, it } from 'vitest';
import { applyExtractedFields, createImportSession, validateCorrection } from '../domain/importSession';
import { detectLinkPlatform, parseLink } from './linkImport';

describe('detectLinkPlatform', () => {
  it('detects supported platforms from URLs', () => {
    expect(detectLinkPlatform('https://www.xiaohongshu.com/explore/abc')).toBe('xiaohongshu');
    expect(detectLinkPlatform('https://mp.weixin.qq.com/s/demo')).toBe('wechat');
    expect(detectLinkPlatform('https://x.com/user/status/1')).toBe('x');
    expect(detectLinkPlatform('https://example.com/post')).toBe('other');
  });

  it('does not match platform names in unsafe hostnames', () => {
    expect(detectLinkPlatform('https://xiaohongshu.com.evil.example/post')).toBe('other');
    expect(detectLinkPlatform('not a url x.com')).toBe('other');
  });
});

describe('parseLink', () => {
  it('returns best-effort suggestions for supported links', async () => {
    const result = await parseLink('https://www.xiaohongshu.com/explore/abc');

    expect(result.sourcePlatform).toBe('xiaohongshu');
    expect(result.fields.title).toContain('小红书');
    expect(result.fields.hookLines?.length).toBeGreaterThan(0);
    expect(result.fields.topic).toBeTruthy();
    expect(result.fields.bodySummary).toContain('https://www.xiaohongshu.com/explore/abc');
    expect(result.errors).toEqual([]);
    expect(result.confidence.sourcePlatform).toBe('high');
  });

  it('makes supported-link suggestions recoverably saveable after auto-fill', async () => {
    const session = createImportSession({ sourceType: 'link', sourceUrl: 'https://www.xiaohongshu.com/explore/abc' });
    const parsed = await parseLink('https://www.xiaohongshu.com/explore/abc');
    const merged = applyExtractedFields(session, parsed.fields, parsed.confidence);

    expect(validateCorrection(merged)).toEqual([]);
  });

  it('auto-fills platform-specific suggestions for WeChat and X links', async () => {
    await expect(parseLink('https://mp.weixin.qq.com/s/demo')).resolves.toMatchObject({
      sourcePlatform: 'wechat',
      fields: expect.objectContaining({
        title: expect.stringContaining('公众号'),
        topic: expect.any(String),
      }),
      errors: [],
    });
    await expect(parseLink('https://x.com/user/status/1')).resolves.toMatchObject({
      sourcePlatform: 'x',
      fields: expect.objectContaining({
        title: expect.stringContaining('X'),
        hookLines: expect.any(Array),
      }),
      errors: [],
    });
  });

  it('preserves unsupported links and returns a manual fallback error', async () => {
    const result = await parseLink('https://example.com/post');

    expect(result.sourcePlatform).toBe('other');
    expect(result.fields.sourceUrl).toBe('https://example.com/post');
    expect(result.errors[0]).toContain('手动补充');
  });
});
