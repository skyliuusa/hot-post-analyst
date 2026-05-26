import { useState } from 'react';
import { analyzeCorrection } from '../../domain/analysis';
import {
  addAssetToSession,
  applyExtractedFields,
  buildCorrectedImport,
  markUserEditedField,
  validateCorrection,
} from '../../domain/importSession';
import type { EngagementMetrics, ExtractedFields, ImportSession, PostSignal, SourcePlatform } from '../../domain/types';
import { extractOcrSuggestions } from '../../services/ocrImport';

type CorrectionWorkspaceProps = {
  initialSession: ImportSession;
  onSave: (postSignal: PostSignal) => void;
  onSessionChange?: (session: ImportSession) => void;
};

const platformOptions: Array<{ value: SourcePlatform; label: string }> = [
  { value: 'unknown', label: '请选择' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'wechat', label: '公众号' },
  { value: 'x', label: 'X' },
  { value: 'other', label: '其他' },
];

function updateField<K extends keyof ExtractedFields>(session: ImportSession, field: K, value: ExtractedFields[K]) {
  return markUserEditedField(session, field, value);
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function metricInputValue(metrics: EngagementMetrics | undefined, key: keyof EngagementMetrics) {
  return metrics?.[key] ?? '';
}

function updateMetric(session: ImportSession, key: keyof EngagementMetrics, value: string) {
  const metrics = { ...(session.extractedFields.metrics ?? {}) };
  const parsed = parseOptionalNumber(value);
  if (parsed === undefined) {
    delete metrics[key];
  } else {
    metrics[key] = parsed;
  }
  return updateField(session, 'metrics', metrics);
}

export function CorrectionWorkspace({ initialSession, onSave, onSessionChange }: CorrectionWorkspaceProps) {
  const [session, setSession] = useState<ImportSession>(initialSession);
  const [ocrFileName, setOcrFileName] = useState('cover.png');
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrText, setOcrText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const fields = session.extractedFields;

  function commitSession(nextSession: ImportSession) {
    setSession(nextSession);
    onSessionChange?.(nextSession);
  }

  async function handleOcrParse() {
    const uploadSources = ocrFiles.length > 0 ? ocrFiles : [];
    const firstFileName = uploadSources[0]?.name ?? (ocrFileName.trim() || 'ocr-image.png');
    const result = await extractOcrSuggestions({ fileName: firstFileName, text: ocrText });
    const assets = uploadSources.length > 0 ? uploadSources : [{ name: firstFileName } as File];
    let withAsset = session;

    for (const [index, file] of assets.entries()) {
      const assetResult = index === 0 ? result : await extractOcrSuggestions({ fileName: file.name, text: '' });
      withAsset = addAssetToSession(withAsset, {
        id: `asset-${crypto.randomUUID()}`,
        type: assetResult.assetType,
        fileUrl: createUploadedAssetUrl(file),
        ocrText: index === 0 ? ocrText : '',
        ocrConfidence: assetResult.confidence.title === 'high' ? 'high' : assetResult.confidence.title === 'medium' ? 'medium' : 'low',
      });
    }

    const nextSession = {
      ...applyExtractedFields(
        { ...withAsset, rawText: ocrText },
        { ...result.fields, bodySummary: ocrText },
        { ...result.confidence, bodySummary: 'medium' },
      ),
      parseErrors: [],
    };
    commitSession(nextSession);
    setErrors([]);
  }

  function createUploadedAssetUrl(file: File) {
    if (typeof URL.createObjectURL === 'function' && file instanceof File) {
      return URL.createObjectURL(file);
    }
    return `local://${file.name}`;
  }

  function handleSave() {
    const validationErrors = validateCorrection(session);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const correctedImport = buildCorrectedImport(session);
    const postSignal = analyzeCorrection(correctedImport, `post-${crypto.randomUUID()}`);
    onSave(postSignal);
  }

  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.78fr_1.22fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">导入校对</p>
        <h1 className="mt-4 max-w-[460px] text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先校对，再收藏。</h1>
        <p className="mt-5 max-w-[390px] text-base leading-7 text-muted">把链接或截图里提到的标题、前三行和选题确认成可复刻信号。</p>

        {errors.length > 0 ? (
          <div className="mt-8 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700" role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-ink">
          平台
          <select
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'sourcePlatform', event.target.value as SourcePlatform))}
            value={fields.sourcePlatform ?? session.sourcePlatform}
          >
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          原始链接
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'sourceUrl', event.target.value))}
            placeholder="https://..."
            type="url"
            value={fields.sourceUrl ?? session.sourceUrl ?? ''}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          标题
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'title', event.target.value))}
            type="text"
            value={fields.title ?? ''}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          前三行钩子
          <textarea
            className="min-h-32 resize-y rounded-[20px] border border-line bg-white p-4 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) =>
              commitSession(
                updateField(session, 'hookLines', splitLines(event.target.value)),
              )
            }
            value={(fields.hookLines ?? []).join('\n')}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          选题
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'topic', event.target.value))}
            type="text"
            value={fields.topic ?? ''}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          正文摘要
          <textarea
            className="min-h-28 resize-y rounded-[20px] border border-line bg-white p-4 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'bodySummary', event.target.value))}
            value={fields.bodySummary ?? ''}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          评论摘要
          <textarea
            className="min-h-24 resize-y rounded-[20px] border border-line bg-white p-4 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'commentSummary', event.target.value))}
            value={fields.commentSummary ?? ''}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ['likes', '点赞'],
            ['saves', '收藏'],
            ['comments', '评论'],
            ['reposts', '转发'],
            ['views', '浏览'],
          ].map(([key, label]) => (
            <label className="grid gap-2 text-sm font-bold text-ink" key={key}>
              {label}
              <input
                className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                min="0"
                onChange={(event) => commitSession(updateMetric(session, key as keyof EngagementMetrics, event.target.value))}
                type="number"
                value={metricInputValue(fields.metrics, key as keyof EngagementMetrics)}
              />
            </label>
          ))}
        </div>

        <label className="grid gap-2 text-sm font-bold text-ink">
          标签
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'tags', splitTags(event.target.value)))}
            placeholder="模板, 流程"
            type="text"
            value={(fields.tags ?? []).join(',')}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-ink">
          备注
          <textarea
            className="min-h-24 resize-y rounded-[20px] border border-line bg-white p-4 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => commitSession(updateField(session, 'notes', event.target.value))}
            value={fields.notes ?? ''}
          />
        </label>

        <div className="grid gap-3 rounded-[24px] border border-line bg-[#fbfcfa] p-4">
          <label className="grid gap-2 text-sm font-bold text-ink">
            上传图片
            <input
              accept="image/*"
              className="min-h-12 rounded-[18px] border border-line bg-white px-4 py-3 text-base font-medium text-ink outline-none file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-accent focus:ring-4 focus:ring-accent/10"
              multiple
              onChange={(event) => setOcrFiles(Array.from(event.target.files ?? []))}
              type="file"
            />
          </label>
          {ocrFiles.length > 0 ? (
            <div className="grid gap-1 text-sm text-muted">
              {ocrFiles.map((file) => (
                <p key={`${file.name}-${file.size}`}>{file.name}</p>
              ))}
            </div>
          ) : null}
          <label className="grid gap-2 text-sm font-bold text-ink">
            图片/OCR 文件名
            <input
              className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              onChange={(event) => setOcrFileName(event.target.value)}
              type="text"
              value={ocrFileName}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-ink">
            图片/OCR 文本
            <textarea
              className="min-h-36 resize-y rounded-[20px] border border-line bg-white p-4 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              onChange={(event) => setOcrText(event.target.value)}
              value={ocrText}
            />
          </label>

          {session.uploadedAssets.length > 0 ? (
            <div className="grid gap-2 text-sm text-muted">
              {session.uploadedAssets.map((asset) => (
                <p key={asset.id}>
                  {asset.fileUrl.replace('local://', '')} · {asset.type}
                  {asset.isSelectedCover ? ' · 已选封面' : ''}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-bold text-ink transition hover:border-accent/45 active:translate-y-px"
            onClick={handleOcrParse}
            type="button"
          >
            添加图片/OCR
          </button>
          <button
            className="min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-white transition active:translate-y-px"
            onClick={handleSave}
            type="button"
          >
            保存到收藏
          </button>
        </div>
      </div>
    </div>
  );
}
