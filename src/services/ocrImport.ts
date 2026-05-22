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
  if (/小红书|\b(?:xhs|xiaohongshu)\b/i.test(text)) return 'xiaohongshu';
  if (/公众号|微信/.test(text)) return 'wechat';
  if (/\b(?:x|twitter)\b|转发|repost/i.test(text)) return 'x';
  return 'unknown';
}

function isChromeLine(line: string) {
  const compact = line.replace(/\s+/g, '');
  if (/^(小红书|公众号|微信|twitter|x)$/i.test(compact)) return true;
  if (/^(小红书)?(赞|收藏|评论|转发|阅读|在看|repost)+$/i.test(compact)) return true;
  return false;
}

export async function extractOcrSuggestions(input: OcrInput): Promise<OcrSuggestionResult> {
  const lines = cleanLines(input.text);
  const sourcePlatform = detectSourcePlatform(input.text);
  const contentLines = lines.filter((line) => !isChromeLine(line));
  const title = contentLines[0];
  const hookLines = contentLines.slice(1, 4);
  const fields: ExtractedFields = {
    sourcePlatform,
  };
  const confidence: FieldConfidence = {
    sourcePlatform: sourcePlatform === 'unknown' ? 'low' : 'medium',
  };

  if (title) {
    fields.title = title;
    fields.topic = '待确认选题';
    confidence.title = 'medium';
    confidence.topic = 'low';
  }

  if (hookLines.length > 0) {
    fields.hookLines = hookLines;
    confidence.hookLines = 'medium';
  }

  return {
    assetType: detectAssetType(input.fileName, input.text),
    fields,
    confidence,
  };
}
