import { describe, expect, it } from 'vitest';
import {
  addAssetToSession,
  applyExtractedFields,
  buildCorrectedImport,
  createImportSession,
  markUserEditedField,
  validateCorrection,
} from './importSession';

describe('importSession', () => {
  it('creates a link import session for review', () => {
    const session = createImportSession({ sourceType: 'link', sourceUrl: 'https://x.com/example/status/1' });

    expect(session.sourceType).toBe('link');
    expect(session.sourcePlatform).toBe('x');
    expect(session.status).toBe('created');
  });

  it('does not overwrite user-edited fields when applying OCR suggestions', () => {
    const session = createImportSession({ sourceType: 'image' });
    const edited = markUserEditedField(session, 'title', '我的标题');
    const merged = applyExtractedFields(edited, { title: 'OCR 标题', topic: '内容流程' }, { title: 'high', topic: 'medium' });

    expect(merged.extractedFields.title).toBe('我的标题');
    expect(merged.extractedFields.topic).toBe('内容流程');
    expect(merged.fieldConfidence.title).toBeUndefined();
    expect(merged.fieldConfidence.topic).toBe('medium');
  });

  it('clears stale confidence when a user edits a field', () => {
    const session = applyExtractedFields(createImportSession({ sourceType: 'image' }), { title: 'OCR 标题' }, { title: 'high' });
    const edited = markUserEditedField(session, 'title', '我的标题');

    expect(edited.fieldConfidence.title).toBeUndefined();
  });

  it('adds uploaded assets and selects the first cover candidate', () => {
    const session = createImportSession({ sourceType: 'manual' });
    const next = addAssetToSession(session, {
      id: 'asset-1',
      type: 'cover',
      fileUrl: 'blob://cover',
      ocrText: '',
      ocrConfidence: 'medium',
    });

    expect(next.uploadedAssets[0].isSelectedCover).toBe(true);
    expect(next.extractedFields.coverAssetId).toBe('asset-1');
  });

  it('requires platform, title or hook text, and at least one source body', () => {
    const session = createImportSession({ sourceType: 'manual' });

    expect(validateCorrection(session)).toEqual([
      '请选择平台。',
      '请补充标题或前三行钩子。',
      '请至少保留链接、图片或正文摘要中的一种。',
    ]);
  });

  it('builds a safe corrected import with fallbacks after validation', () => {
    const session = applyExtractedFields(
      createImportSession({ sourceType: 'manual' }),
      {
        sourcePlatform: 'x',
        hookLines: ['第一行钩子', '第二行钩子'],
        bodySummary: '正文摘要',
      },
      { sourcePlatform: 'high', hookLines: 'medium', bodySummary: 'medium' },
    );

    expect(validateCorrection(session)).toEqual([]);
    expect(buildCorrectedImport(session)).toMatchObject({
      sourcePlatform: 'x',
      title: '第一行钩子',
      hookLines: ['第一行钩子', '第二行钩子'],
      bodySummary: '正文摘要',
      topic: '待确认选题',
    });
  });

  it('uses the title as a hook fallback when hook lines are absent', () => {
    const session = applyExtractedFields(
      createImportSession({ sourceType: 'link', sourceUrl: 'https://x.com/example/status/1' }),
      { title: '只有标题', topic: '内容流程' },
      { title: 'high', topic: 'medium' },
    );

    expect(validateCorrection(session)).toEqual([]);
    expect(buildCorrectedImport(session).hookLines).toEqual(['只有标题']);
  });

  it('throws validation errors when building an invalid corrected import', () => {
    const session = createImportSession({ sourceType: 'manual' });

    expect(() => buildCorrectedImport(session)).toThrow('请选择平台。');
  });

  it('detects platforms from URL hostnames without substring false positives', () => {
    expect(createImportSession({ sourceType: 'link', sourceUrl: 'https://mobile.x.com/example/status/1' }).sourcePlatform).toBe('x');
    expect(createImportSession({ sourceType: 'link', sourceUrl: 'https://x.com.evil.example/status/1' }).sourcePlatform).toBe('other');
    expect(createImportSession({ sourceType: 'link', sourceUrl: 'https://evilx.com/status/1' }).sourcePlatform).toBe('other');
  });
});
