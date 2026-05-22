import type {
  AssetType,
  Confidence,
  CorrectedImport,
  ExtractedFields,
  FieldConfidence,
  ImportedAsset,
  ImportSession,
  SourcePlatform,
  SourceType,
} from './types';

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

  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return 'other';
  }

  if (isHostOrSubdomain(hostname, 'xiaohongshu.com')) return 'xiaohongshu';
  if (isHostOrSubdomain(hostname, 'mp.weixin.qq.com')) return 'wechat';
  if (isHostOrSubdomain(hostname, 'x.com') || isHostOrSubdomain(hostname, 'twitter.com')) return 'x';
  return 'other';
}

function setExtractedField<K extends keyof ExtractedFields>(fields: ExtractedFields, key: K, value: ExtractedFields[K]) {
  fields[key] = value;
}

function isHostOrSubdomain(hostname: string, expectedHost: string) {
  return hostname === expectedHost || hostname.endsWith(`.${expectedHost}`);
}

function removeFieldConfidence(confidence: FieldConfidence, field: keyof ExtractedFields): FieldConfidence {
  const next = { ...confidence };
  delete next[field];
  return next;
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
    fieldConfidence: removeFieldConfidence(session.fieldConfidence, field),
    userEditedFields: [...new Set([...session.userEditedFields, field])],
    updatedAt: nowIso(),
  };
}

export function applyExtractedFields(session: ImportSession, fields: ExtractedFields, confidence: FieldConfidence): ImportSession {
  const nextFields = { ...session.extractedFields };
  const nextConfidence = { ...session.fieldConfidence };

  for (const key of Object.keys(fields) as Array<keyof ExtractedFields>) {
    const value = fields[key];
    if (value === undefined) continue;
    if (session.userEditedFields.includes(key)) continue;
    setExtractedField(nextFields, key, value);
  }

  for (const key of Object.keys(confidence) as Array<keyof ExtractedFields>) {
    if (session.userEditedFields.includes(key)) continue;
    nextConfidence[key] = confidence[key];
  }

  return {
    ...session,
    status: 'needsReview',
    extractedFields: nextFields,
    fieldConfidence: nextConfidence,
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
  const hasAcceptedTitle = Boolean(fields.title?.trim()) && session.fieldConfidence.title !== 'low';
  const hasAcceptedHook = Boolean(fields.hookLines?.some((line) => line.trim())) && session.fieldConfidence.hookLines !== 'low';
  const hasTitleOrHook = hasAcceptedTitle || hasAcceptedHook;
  const hasSourceBody = Boolean(fields.sourceUrl?.trim()) || session.uploadedAssets.length > 0 || Boolean(fields.bodySummary?.trim());

  if (!fields.sourcePlatform || fields.sourcePlatform === 'unknown') errors.push('请选择平台。');
  if (!hasTitleOrHook) errors.push('请补充标题或前三行钩子。');
  if (!hasSourceBody) errors.push('请至少保留链接、图片或正文摘要中的一种。');

  return errors;
}

export function buildCorrectedImport(session: ImportSession): CorrectedImport {
  const errors = validateCorrection(session);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  const fields = session.extractedFields;
  const hookLines = fields.hookLines?.filter((line) => line.trim()) ?? [];
  const title = fields.title?.trim() || hookLines[0];
  const safeHookLines = hookLines.length > 0 ? hookLines : [title];

  return {
    ...fields,
    sourcePlatform: fields.sourcePlatform ?? session.sourcePlatform,
    sourceUrl: fields.sourceUrl ?? session.sourceUrl,
    title,
    hookLines: safeHookLines,
    topic: fields.topic?.trim() || '待确认选题',
    tags: fields.tags ?? [],
    metrics: fields.metrics ?? {},
  };
}
