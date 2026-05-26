import { useState } from 'react';
import { addAssetToSession, applyExtractedFields, createImportSession } from '../../domain/importSession';
import type { ImportSession } from '../../domain/types';
import { parseLink } from '../../services/linkImport';
import { extractOcrSuggestions } from '../../services/ocrImport';

type ImportEntryProps = {
  onSessionReady: (session: ImportSession) => void;
};

export function ImportEntry({ onSessionReady }: ImportEntryProps) {
  const [link, setLink] = useState('');
  const [imageFileName, setImageFileName] = useState('cover.png');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageOcrText, setImageOcrText] = useState('');
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

  async function handleImageImport() {
    const uploadSources = imageFiles.length > 0 ? imageFiles : [];
    const firstFileName = uploadSources[0]?.name ?? (imageFileName.trim() || 'ocr-image.png');
    const result = await extractOcrSuggestions({ fileName: firstFileName, text: imageOcrText });
    const session = createImportSession({ sourceType: 'image' });
    const assets = uploadSources.length > 0 ? uploadSources : [{ name: firstFileName } as File];
    let withAsset = session;

    for (const [index, file] of assets.entries()) {
      const assetResult = index === 0 ? result : await extractOcrSuggestions({ fileName: file.name, text: '' });
      withAsset = addAssetToSession(withAsset, {
        id: `asset-${crypto.randomUUID()}`,
        type: assetResult.assetType,
        fileUrl: createUploadedAssetUrl(file),
        ocrText: index === 0 ? imageOcrText : '',
        ocrConfidence: assetResult.confidence.title === 'high' ? 'high' : assetResult.confidence.title === 'medium' ? 'medium' : 'low',
      });
    }

    const nextSession = {
      ...applyExtractedFields(
        { ...withAsset, rawText: imageOcrText },
        { ...result.fields, bodySummary: imageOcrText },
        { ...result.confidence, bodySummary: 'medium' },
      ),
      parseErrors: [],
    };

    setParseError('');
    onSessionReady(nextSession);
  }

  function createUploadedAssetUrl(file: File) {
    if (typeof URL.createObjectURL === 'function' && file instanceof File) {
      return URL.createObjectURL(file);
    }
    return `local://${file.name}`;
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

        <div className="grid gap-3 rounded-[24px] border border-line bg-white p-4">
          <label className="grid gap-2 text-sm font-bold text-ink">
            上传图片
            <input
              accept="image/*"
              className="min-h-12 rounded-[18px] border border-line bg-white px-4 py-3 text-base font-medium text-ink outline-none file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:border-accent focus:ring-4 focus:ring-accent/10"
              multiple
              onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))}
              type="file"
            />
          </label>
          {imageFiles.length > 0 ? (
            <div className="grid gap-1 text-sm text-muted">
              {imageFiles.map((file) => (
                <p key={`${file.name}-${file.size}`}>{file.name}</p>
              ))}
            </div>
          ) : null}
          <label className="grid gap-2 text-sm font-bold text-ink">
            图片/OCR 文件名
            <input
              className="min-h-12 rounded-[18px] border border-line bg-white px-4 text-base font-medium text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              onChange={(event) => setImageFileName(event.target.value)}
              type="text"
              value={imageFileName}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            图片/OCR 文本
            <textarea
              className="min-h-28 resize-y rounded-[18px] border border-line bg-white px-4 py-3 text-base leading-7 text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
              onChange={(event) => setImageOcrText(event.target.value)}
              placeholder="粘贴截图 OCR 文本或手动摘录"
              value={imageOcrText}
            />
          </label>
        </div>

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
          <button
            className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-bold text-ink transition hover:border-accent/45 active:translate-y-px"
            onClick={handleImageImport}
            type="button"
          >
            图片/OCR 导入
          </button>
        </div>
      </div>
    </div>
  );
}
