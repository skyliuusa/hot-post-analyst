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

  return {
    sourcePlatform,
    fields: {
      sourcePlatform,
      sourceUrl: url,
      title: `${platformLabel}链接已识别，内容待人工提取`,
    },
    confidence: {
      sourcePlatform: 'high',
      sourceUrl: 'high',
      title: 'low',
    },
    errors: ['已识别链接来源，正文、标题和钩子需要人工补充后再保存。'],
  };
}
