import { useState } from 'react';
import { analyzeCorrection } from '../../domain/analysis';
import {
  applyExtractedFields,
  buildCorrectedImport,
  markUserEditedField,
  validateCorrection,
} from '../../domain/importSession';
import type { ExtractedFields, ImportSession, PostSignal, SourcePlatform } from '../../domain/types';
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

export function CorrectionWorkspace({ initialSession, onSave, onSessionChange }: CorrectionWorkspaceProps) {
  const [session, setSession] = useState<ImportSession>(initialSession);
  const [ocrText, setOcrText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const fields = session.extractedFields;

  function commitSession(nextSession: ImportSession) {
    setSession(nextSession);
    onSessionChange?.(nextSession);
  }

  async function handleOcrParse() {
    const result = await extractOcrSuggestions({ fileName: 'ocr-text.txt', text: ocrText });
    const nextSession = {
      ...applyExtractedFields(
        { ...session, rawText: ocrText },
        { ...result.fields, bodySummary: ocrText },
        { ...result.confidence, bodySummary: 'medium' },
      ),
      parseErrors: [],
    };
    commitSession(nextSession);
    setErrors([]);
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
                updateField(
                  session,
                  'hookLines',
                  event.target.value
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean),
                ),
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
          OCR 文本
          <textarea
            className="min-h-36 resize-y rounded-[20px] border border-line bg-[#fbfcfa] p-4 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => setOcrText(event.target.value)}
            value={ocrText}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-bold text-ink transition hover:border-accent/45 active:translate-y-px"
            onClick={handleOcrParse}
            type="button"
          >
            解析上传内容
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
