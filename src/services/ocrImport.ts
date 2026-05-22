import type { AssetType, ExtractedFields, FieldConfidence, SourcePlatform } from '../domain/types';

type OcrInput = {
  fileName: string;
  text: string;
};

export type OcrSuggestionResult = {
  assetType: AssetType;
  fields: ExtractedFields;
  confidence: FieldConfidence;
};

function cleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectAssetType(fileName: string, text: string): AssetType {
  const fileHint = fileName.toLowerCase();
  if (/comment|comments|评论/.test(fileHint)) return 'commentScreenshot';
  if (/content|body|正文|内容/.test(fileHint)) return 'contentScreenshot';

  const textLines = cleanLines(text);
  if (textLines.some((line) => /评论区|用户评论|全部评论|精选评论/.test(line))) return 'commentScreenshot';
  if (textLines.some((line) => /正文内容|原文内容|笔记正文/.test(line))) return 'contentScreenshot';
  return 'cover';
}

function detectSourcePlatform(text: string): SourcePlatform {
  if (/小红书|赞|收藏|评论/.test(text)) return 'xiaohongshu';
  if (/公众号|微信|阅读|在看/.test(text)) return 'wechat';
  if (/\b(?:x|twitter)\b|转发|repost/i.test(text)) return 'x';
  return 'unknown';
}

function isChromeLine(line: string) {
  return /小红书|公众号|微信|twitter|^x$|赞|收藏|评论|阅读|在看|repost/i.test(line);
}

export async function extractOcrSuggestions(input: OcrInput): Promise<OcrSuggestionResult> {
  const lines = cleanLines(input.text);
  const sourcePlatform = detectSourcePlatform(input.text);
  const contentLines = lines.filter((line) => !isChromeLine(line));
  const title = contentLines[0];
  const hookLines = contentLines.slice(1, 4);

  return {
    assetType: detectAssetType(input.fileName, input.text),
    fields: {
      sourcePlatform,
      title,
      hookLines,
      topic: title ? '待确认选题' : undefined,
    },
    confidence: {
      sourcePlatform: sourcePlatform === 'unknown' ? 'low' : 'medium',
      title: title ? 'medium' : 'low',
      hookLines: hookLines.length > 0 ? 'medium' : 'low',
      topic: 'low',
    },
  };
}
