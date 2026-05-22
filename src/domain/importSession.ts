import type { AssetType, Confidence, ExtractedFields, FieldConfidence, ImportedAsset, ImportSession, SourcePlatform, SourceType } from './types';

type CreateImportSessionInput = {
  sourceType: SourceType;
  sourceUrl?: string;
};

type AddAssetInput = {
  id: string;
  type: AssetType;
  fileUrl: string;
  ocrText: string;
  ocrConfidence: Confidence;
};

function nowIso() {
  return new Date().toISOString();
}

function detectPlatformFromUrl(url?: string): SourcePlatform {
  if (!url) return 'unknown';
  if (url.includes('xiaohongshu.com')) return 'xiaohongshu';
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x';
  return 'other';
}

function setExtractedField<K extends keyof ExtractedFields>(fields: ExtractedFields, key: K, value: ExtractedFields[K]) {
  fields[key] = value;
}

export function createImportSession(input: CreateImportSessionInput): ImportSession {
  const createdAt = nowIso();
  const sourcePlatform = detectPlatformFromUrl(input.sourceUrl);

  return {
    id: `import-${crypto.randomUUID()}`,
    sourceType: input.sourceType,
    sourcePlatform,
    sourceUrl: input.sourceUrl,
    status: 'created',
    rawText: '',
    uploadedAssets: [],
    extractedFields: {
      sourcePlatform,
      sourceUrl: input.sourceUrl,
    },
    fieldConfidence: {},
    userEditedFields: [],
    parseErrors: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function markUserEditedField<K extends keyof ExtractedFields>(session: ImportSession, field: K, value: ExtractedFields[K]): ImportSession {
  return {
    ...session,
    extractedFields: {
      ...session.extractedFields,
      [field]: value,
    },
    userEditedFields: [...new Set([...session.userEditedFields, field])],
    updatedAt: nowIso(),
  };
}

export function applyExtractedFields(session: ImportSession, fields: ExtractedFields, confidence: FieldConfidence): ImportSession {
  const nextFields = { ...session.extractedFields };

  for (const key of Object.keys(fields) as Array<keyof ExtractedFields>) {
    const value = fields[key];
    if (value === undefined) continue;
    if (session.userEditedFields.includes(key)) continue;
    setExtractedField(nextFields, key, value);
  }

  return {
    ...session,
    status: 'needsReview',
    extractedFields: nextFields,
    fieldConfidence: {
      ...session.fieldConfidence,
      ...confidence,
    },
    updatedAt: nowIso(),
  };
}

export function addAssetToSession(session: ImportSession, input: AddAssetInput): ImportSession {
  const shouldSelectCover = input.type === 'cover' && !session.uploadedAssets.some((asset) => asset.isSelectedCover);
  const createdAt = nowIso();
  const asset: ImportedAsset = {
    ...input,
    importSessionId: session.id,
    isSelectedCover: shouldSelectCover,
    createdAt,
  };

  return {
    ...session,
    uploadedAssets: [...session.uploadedAssets, asset],
    extractedFields: shouldSelectCover ? { ...session.extractedFields, coverAssetId: input.id } : session.extractedFields,
    updatedAt: createdAt,
  };
}

export function validateCorrection(session: ImportSession): string[] {
  const errors: string[] = [];
  const fields = session.extractedFields;
  const hasTitleOrHook = Boolean(fields.title?.trim()) || Boolean(fields.hookLines?.some((line) => line.trim()));
  const hasSourceBody = Boolean(fields.sourceUrl?.trim()) || session.uploadedAssets.length > 0 || Boolean(fields.bodySummary?.trim());

  if (!fields.sourcePlatform || fields.sourcePlatform === 'unknown') errors.push('请选择平台。');
  if (!hasTitleOrHook) errors.push('请补充标题或前三行钩子。');
  if (!hasSourceBody) errors.push('请至少保留链接、图片或正文摘要中的一种。');

  return errors;
}
