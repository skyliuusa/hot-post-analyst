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
    expect(result.confidence.sourcePlatform).toBe('high');
  });

  it('does not make supported-link suggestions saveable without real content', async () => {
    const session = createImportSession({ sourceType: 'link', sourceUrl: 'https://www.xiaohongshu.com/explore/abc' });
    const parsed = await parseLink('https://www.xiaohongshu.com/explore/abc');
    const merged = applyExtractedFields(session, parsed.fields, parsed.confidence);

    expect(parsed.fields.hookLines).toBeUndefined();
    expect(parsed.fields.topic).toBeUndefined();
    expect(parsed.fields.bodySummary).toBeUndefined();
    expect(parsed.errors[0]).toContain('人工补充');
    expect(validateCorrection(merged)).toContain('请补充标题或前三行钩子。');
  });

  it('preserves unsupported links and returns a manual fallback error', async () => {
    const result = await parseLink('https://example.com/post');

    expect(result.sourcePlatform).toBe('other');
    expect(result.fields.sourceUrl).toBe('https://example.com/post');
    expect(result.errors[0]).toContain('手动补充');
  });
});
