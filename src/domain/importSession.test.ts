import { describe, expect, it } from 'vitest';
import { addAssetToSession, applyExtractedFields, createImportSession, markUserEditedField, validateCorrection } from './importSession';

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
    expect(merged.fieldConfidence.topic).toBe('medium');
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
});
