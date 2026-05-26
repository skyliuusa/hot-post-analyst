import type { ExtractedFields, FieldConfidence, SourcePlatform } from '../domain/types';

export type ParsedLinkResult = {
  sourcePlatform: SourcePlatform;
  fields: ExtractedFields;
  confidence: FieldConfidence;
  errors: string[];
};

function isHostOrSubdomain(hostname: string, expectedHost: string) {
  return hostname === expectedHost || hostname.endsWith(`.${expectedHost}`);
}

function getUrlHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

export function detectLinkPlatform(url: string): SourcePlatform {
  const hostname = getUrlHostname(url);
  if (!hostname) return 'other';

  if (isHostOrSubdomain(hostname, 'xiaohongshu.com')) return 'xiaohongshu';
  if (isHostOrSubdomain(hostname, 'mp.weixin.qq.com')) return 'wechat';
  if (isHostOrSubdomain(hostname, 'x.com') || isHostOrSubdomain(hostname, 'twitter.com')) return 'x';
  return 'other';
}

export async function parseLink(url: string): Promise<ParsedLinkResult> {
  const sourcePlatform = detectLinkPlatform(url);

  if (sourcePlatform === 'other') {
    return {
      sourcePlatform,
      fields: { sourcePlatform, sourceUrl: url },
      confidence: { sourcePlatform: 'medium', sourceUrl: 'high' },
      errors: ['暂不支持该链接自动解析，请手动补充内容。'],
    };
  }

  const platformLabel = sourcePlatform === 'xiaohongshu' ? '小红书' : sourcePlatform === 'wechat' ? '公众号' : 'X';
  const topic =
    sourcePlatform === 'xiaohongshu' ? '爆款笔记拆解' : sourcePlatform === 'wechat' ? '公众号文章拆解' : '短帖观点拆解';

  return {
    sourcePlatform,
    fields: {
      sourcePlatform,
      sourceUrl: url,
      title: `${platformLabel}链接自动导入`,
      hookLines: [`已识别 ${platformLabel} 链接。`, '先保留原帖结构，再补充截图或正文。', '保存前确认标题、评论需求和关键指标。'],
      bodySummary: `来自 ${platformLabel} 的链接导入：${url}`,
      topic,
      tags: [platformLabel, '待校对'],
    },
    confidence: {
      sourcePlatform: 'high',
      sourceUrl: 'high',
      title: 'medium',
      hookLines: 'low',
      bodySummary: 'low',
      topic: 'low',
      tags: 'low',
    },
    errors: [],
  };
}
