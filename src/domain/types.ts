export type SourcePlatform = 'xiaohongshu' | 'wechat' | 'x' | 'other' | 'unknown';
export type SourceType = 'link' | 'image' | 'manual';
export type Confidence = 'high' | 'medium' | 'low';
export type ImportStatus = 'created' | 'parsing' | 'needsReview' | 'failed' | 'saved';
export type AssetType = 'cover' | 'contentScreenshot' | 'commentScreenshot' | 'unknown';
export type PostSignalStatus = 'saved' | 'drafted' | 'published' | 'archived';
export type DraftBriefStatus = 'draft' | 'used' | 'discarded';
export type ReviewDecision = 'continue' | 'changeAngle' | 'discard';

export type EngagementMetrics = {
  likes?: number;
  saves?: number;
  comments?: number;
  reposts?: number;
  views?: number;
};

export type ImportedAsset = {
  id: string;
  importSessionId: string;
  type: AssetType;
  fileUrl: string;
  ocrText: string;
  ocrConfidence: Confidence;
  isSelectedCover: boolean;
  createdAt: string;
};

export type ExtractedFields = {
  sourcePlatform?: SourcePlatform;
  sourceUrl?: string;
  title?: string;
  coverAssetId?: string;
  hookLines?: string[];
  bodySummary?: string;
  commentSummary?: string;
  topic?: string;
  tags?: string[];
  metrics?: EngagementMetrics;
  notes?: string;
};

export type FieldConfidence = Partial<Record<keyof ExtractedFields, Confidence>>;

export type ImportSession = {
  id: string;
  sourceType: SourceType;
  sourcePlatform: SourcePlatform;
  sourceUrl?: string;
  status: ImportStatus;
  rawText: string;
  uploadedAssets: ImportedAsset[];
  extractedFields: ExtractedFields;
  fieldConfidence: FieldConfidence;
  userEditedFields: Array<keyof ExtractedFields>;
  parseErrors: string[];
  createdAt: string;
  updatedAt: string;
};

export type CorrectedImport = Required<Pick<ExtractedFields, 'sourcePlatform' | 'title' | 'hookLines' | 'topic'>> &
  Omit<ExtractedFields, 'sourcePlatform' | 'title' | 'hookLines' | 'topic'>;

export type PostSignal = {
  id: string;
  sourcePlatform: SourcePlatform;
  sourceUrl?: string;
  title: string;
  coverAssetId?: string;
  hookLines: string[];
  bodySummary?: string;
  commentSummary?: string;
  topic: string;
  tags: string[];
  metrics: EngagementMetrics;
  replicationScore: number;
  coverSignal: string;
  hookSignal: string;
  topicClusterId: string;
  commentDemandSignal: string;
  recommendedNextAction: string;
  draftSeed: string;
  status: PostSignalStatus;
  createdAt: string;
  updatedAt: string;
};

export type TopicCluster = {
  id: string;
  name: string;
  postSignalIds: string[];
  bestPostSignalId: string;
  postCount: number;
  averageScore: number;
  latestSignalAt: string;
};

export type DraftBrief = {
  id: string;
  postSignalId: string;
  titleOptions: string[];
  coverPromise: string;
  openingHook: string;
  outline: string[];
  angleTransformation: 'keep' | 'narrow' | 'reverse' | 'localize' | 'personalProof' | 'mistakeList';
  status: DraftBriefStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReviewResult = {
  id: string;
  draftBriefId: string;
  postSignalId: string;
  publishedPlatform: SourcePlatform;
  publishedAt: string;
  finalTitle: string;
  metrics: EngagementMetrics;
  notes: string;
  decision: ReviewDecision;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
};
