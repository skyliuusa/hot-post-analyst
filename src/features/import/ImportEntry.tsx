import { useState } from 'react';
import { applyExtractedFields, createImportSession } from '../../domain/importSession';
import type { ImportSession } from '../../domain/types';
import { parseLink } from '../../services/linkImport';

type ImportEntryProps = {
  onSessionReady: (session: ImportSession) => void;
};

export function ImportEntry({ onSessionReady }: ImportEntryProps) {
  const [link, setLink] = useState('');
  const [parseError, setParseError] = useState('');

  async function handleAutoParse() {
    const result = await parseLink(link);
    const session = createImportSession({ sourceType: 'link', sourceUrl: link });
    const nextSession = {
      ...applyExtractedFields(session, result.fields, result.confidence),
      parseErrors: result.errors,
    };

    setParseError(result.errors[0] ?? '');
    onSessionReady(nextSession);
  }

  function handleManualEntry() {
    setParseError('');
    onSessionReady(createImportSession({ sourceType: 'manual' }));
  }

  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">导入热帖</p>
        <h1 className="mt-4 max-w-[430px] text-[52px] font-bold leading-[0.95] tracking-[-0.06em] text-ink">把热帖变成可复刻信号。</h1>
        <p className="mt-5 max-w-[390px] text-base leading-7 text-muted">先粘贴链接自动识别来源；解析不完整时继续进入校对页补齐。</p>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-line bg-[#fbfcfa] p-5 sm:p-6">
        <label className="grid gap-2 text-sm font-bold text-ink">
          热帖链接
          <input
            className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://www.xiaohongshu.com/explore/..."
            type="url"
            value={link}
          />
        </label>

        {parseError ? <p className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{parseError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-white transition active:translate-y-px"
            onClick={handleAutoParse}
            type="button"
          >
            自动解析
          </button>
          <button
            className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-bold text-ink transition hover:border-accent/45 active:translate-y-px"
            onClick={handleManualEntry}
            type="button"
          >
            手动录入
          </button>
        </div>
      </div>
    </div>
  );
}
