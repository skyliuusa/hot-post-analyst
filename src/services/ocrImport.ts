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

function parseMetricValue(value: string) {
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractMetrics(lines: string[]): ExtractedFields['metrics'] {
  const metrics: NonNullable<ExtractedFields['metrics']> = {};

  for (const line of lines) {
    const compact = line.replace(/\s+/g, '');
    const match = compact.match(/(赞|点赞|喜欢|收藏|评论|留言|转发|分享|浏览|阅读|观看|views?|likes?|saves?|comments?|reposts?)([:：]?)([\d,]+)/i);
    if (!match) continue;

    const value = parseMetricValue(match[3]);
    if (value === undefined) continue;

    const label = match[1].toLowerCase();
    if (/赞|点赞|喜欢|likes?/.test(label)) metrics.likes = value;
    if (/收藏|saves?/.test(label)) metrics.saves = value;
    if (/评论|留言|comments?/.test(label)) metrics.comments = value;
    if (/转发|分享|reposts?/.test(label)) metrics.reposts = value;
    if (/浏览|阅读|观看|views?/.test(label)) metrics.views = value;
  }

  return Object.keys(metrics).length > 0 ? metrics : undefined;
}

function stripMetricLines(lines: string[]) {
  return lines.filter((line) => !/(赞|点赞|喜欢|收藏|评论|留言|转发|分享|浏览|阅读|观看|views?|likes?|saves?|comments?|reposts?)\s*[:：]?\s*[\d,]+/i.test(line));
}

export async function extractOcrSuggestions(input: OcrInput): Promise<OcrSuggestionResult> {
  const lines = cleanLines(input.text);
  const sourcePlatform = detectSourcePlatform(input.text);
  const assetType = detectAssetType(input.fileName, input.text);
  const metrics = extractMetrics(lines);
  const contentLines = stripMetricLines(lines.filter((line) => !isChromeLine(line)));
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

  if (assetType === 'commentScreenshot') {
    const commentLines = contentLines.filter((line) => !/用户评论|全部评论|精选评论|评论区/.test(line));
    if (commentLines.length > 0) {
      fields.commentSummary = commentLines.slice(0, 3).join('；');
      confidence.commentSummary = 'medium';
    }
  }

  if (metrics) {
    fields.metrics = metrics;
    confidence.metrics = 'medium';
  }

  return {
    assetType,
    fields,
    confidence,
  };
}
