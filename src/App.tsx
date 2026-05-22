import { useMemo, useState } from 'react';
import type { ImportSession, PostSignal } from './domain/types';
import { CorrectionWorkspace } from './features/import/CorrectionWorkspace';
import { ImportEntry } from './features/import/ImportEntry';
import { useWorkspaceStore } from './state/workspaceStore';

type ViewId = 'landing' | 'today' | 'import' | 'saved' | 'draft' | 'review';
type SavedPost = {
  id: string;
  score: string;
  title: string;
  hookLines: string[];
  topic: string;
  topicCount: number;
  signal: string;
  content: string;
  draft: string;
  palette: string;
};
type SavedMode = 'cover' | 'hook' | 'topic';

const views: Array<{ id: ViewId; label: string }> = [
  { id: 'landing', label: '首页' },
  { id: 'today', label: '今日' },
  { id: 'import', label: '导入' },
  { id: 'saved', label: '收藏' },
  { id: 'draft', label: '起稿' },
  { id: 'review', label: '复盘' },
];

const sidebarItems: Array<{ id: ViewId; label: string }> = [
  { id: 'today', label: '今日' },
  { id: 'import', label: '导入' },
  { id: 'saved', label: '收藏' },
  { id: 'draft', label: '起稿' },
  { id: 'review', label: '复盘' },
];

const savedPosts: SavedPost[] = [
  {
    id: 'proof-list',
    score: '86',
    title: '带具体证据的清单封面',
    hookLines: ['我把一套内容流程跑了 21 天。', '真正有效的不是灵感，而是这 5 个检查点。', '最后一个直接决定保存率。'],
    topic: '内容流程',
    topicCount: 7,
    signal: '封面先给证据，再给步骤，评论区集中追问执行细节。',
    content: '核心不是清单本身，而是用一个可信证据让用户相信这套方法真的被跑过。',
    draft: '把你的真实流程拆成 5 步，封面只写结果和证据，不写抽象价值。',
    palette: 'from-[#e6f4ef] via-[#f7faf5] to-[#dfeee9]',
  },
  {
    id: 'comment-loop',
    score: '79',
    title: '评论区反复问同一个问题',
    hookLines: ['为什么你明明收藏很多，还是写不出来？', '问题不在素材少，而在没有把评论需求抽出来。', '先看这三个高频追问。'],
    topic: '创作卡点',
    topicCount: 5,
    signal: '同一个疑问出现多次，说明原帖没有解释清楚，适合补充型复刻。',
    content: '从评论里提炼用户卡点，用“为什么你一直做不出来”作为开头。',
    draft: '标题先写疑问，再用 3 个短段回答，最后给一个可执行检查项。',
    palette: 'from-[#edf2ea] via-[#fbfcf8] to-[#e7efe3]',
  },
  {
    id: 'contrast-cover',
    score: '74',
    title: '反差式封面标题组合',
    hookLines: ['大多数人把标题写反了。', '先给错误动作，再给替代流程。', '这个结构比单纯讲技巧更容易被点开。'],
    topic: '标题结构',
    topicCount: 4,
    signal: '标题制造反差，封面负责给场景，适合改成自己的行业版本。',
    content: '不要复刻原话，保留“误区到正确动作”的结构就够了。',
    draft: '写 3 组反差标题：错误动作、真实原因、替代流程。',
    palette: 'from-[#f0f1e8] via-[#fbfaf4] to-[#e8eee6]',
  },
  {
    id: 'cross-platform',
    score: '68',
    title: '同题多平台升温',
    hookLines: ['同一个问题这周在两个平台都热了。', '这说明它不是偶发流量。', '先做一条轻量版本验证。'],
    topic: '趋势选题',
    topicCount: 6,
    signal: '同一题材在不同平台出现，说明需求不是偶发流量。',
    content: '先做轻量复刻，不需要完整长文，用短帖验证保存率。',
    draft: '把原题变成“本周我会怎么做”的个人流程，先发短版本。',
    palette: 'from-[#e7f1ef] via-[#f8faf7] to-[#eef2e8]',
  },
  {
    id: 'before-after',
    score: '82',
    title: '前后对比封面',
    hookLines: ['同样的内容，换一个对比方式就更容易保存。', '用户要看的不是过程，是变化。', '把前后差异写到第一屏。'],
    topic: '封面表达',
    topicCount: 8,
    signal: '用户能一眼看到变化，适合承载工具、流程、复盘类内容。',
    content: '对比越具体，越容易被保存。避免“变好”这种模糊承诺。',
    draft: '封面写前后差异，正文只解释造成变化的 3 个动作。',
    palette: 'from-[#e5f3ec] via-[#fbfcfa] to-[#edf3e8]',
  },
  {
    id: 'mistake-thread',
    score: '71',
    title: '错误清单型内容',
    hookLines: ['你以为是在做内容，其实是在重复 5 个错误。', '每一个错误都会降低转化。', '先改第 2 个。'],
    topic: '避坑清单',
    topicCount: 3,
    signal: '读者容易代入自己的问题，评论区会补充更多反例。',
    content: '这类内容适合做成“少做什么”，不适合写成长篇教学。',
    draft: '列出 5 个常见错误，每条只配一个修正动作。',
    palette: 'from-[#eef4e7] via-[#fbfbf6] to-[#e6efeb]',
  },
];

const importedPalettes = [
  'from-[#e6f4ef] via-[#f7faf5] to-[#dfeee9]',
  'from-[#edf2ea] via-[#fbfcf8] to-[#e7efe3]',
  'from-[#f0f1e8] via-[#fbfaf4] to-[#e8eee6]',
];

function mapPostSignalsToSavedPosts(signals: PostSignal[]): SavedPost[] {
  const topicCounts = signals.reduce<Record<string, number>>((counts, signal) => {
    counts[signal.topic] = (counts[signal.topic] ?? 0) + 1;
    return counts;
  }, {});

  return signals.map((signal, index) => ({
    id: signal.id,
    score: String(signal.replicationScore),
    title: signal.title,
    hookLines: signal.hookLines,
    topic: signal.topic,
    topicCount: topicCounts[signal.topic] ?? 1,
    signal: signal.hookSignal,
    content: signal.draftSeed,
    draft: signal.recommendedNextAction,
    palette: importedPalettes[index % importedPalettes.length],
  }));
}

function getInitialView(): ViewId {
  const view = new URLSearchParams(window.location.search).get('view');
  return views.some((item) => item.id === view) ? (view as ViewId) : 'landing';
}

function getInitialDraft(): SavedPost {
  const postId = new URLSearchParams(window.location.search).get('post');
  return savedPosts.find((post) => post.id === postId) ?? savedPosts[0];
}

function IconButton({ label }: { label: string }) {
  return (
    <button
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition active:translate-y-px"
      type="button"
    >
      <span className="h-3 w-3 rounded-[4px] border border-soft" />
    </button>
  );
}

function TopNav({ activeView, onViewChange }: { activeView: ViewId; onViewChange: (view: ViewId) => void }) {
  return (
    <nav className="flex items-center justify-between border-b border-line" aria-label="主导航">
      <button className="flex items-center gap-3" onClick={() => onViewChange('landing')} type="button">
        <div className="size-7 rounded-[9px] bg-ink" aria-hidden="true" />
        <span className="font-bold tracking-[-0.03em] text-ink">Hot Post Analyst</span>
      </button>

      <div className="hidden items-center gap-1 rounded-full border border-line bg-white p-1 lg:flex">
        {views.map((view) => (
          <button
            className={[
              'min-h-9 rounded-full px-4 text-sm transition active:translate-y-px',
              activeView === view.id ? 'bg-ink font-semibold text-white' : 'text-muted hover:text-ink',
            ].join(' ')}
            key={view.id}
            onClick={() => onViewChange(view.id)}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted sm:inline">私有工作区</span>
        <IconButton label="搜索" />
        <IconButton label="设置" />
        <button className="min-h-10 rounded-full bg-ink px-5 text-sm font-bold text-white transition active:translate-y-px" type="button">
          开始使用
        </button>
      </div>
    </nav>
  );
}

function ProductSidebar({ activeView, onViewChange }: { activeView: ViewId; onViewChange?: (view: ViewId) => void }) {
  return (
    <aside
      aria-label="产品功能导航"
      className="flex items-center justify-center gap-3 border-b border-line bg-[#fbfcfa] px-3 py-4 md:flex-col md:justify-start md:border-b-0 md:border-r md:py-8"
    >
      {sidebarItems.map((item) => (
        <button
          aria-label={item.label}
          className={[
            'grid size-11 place-items-center rounded-2xl border transition active:translate-y-px',
            activeView === item.id ? 'border-ink bg-ink' : 'border-line bg-white',
          ].join(' ')}
          key={item.id}
          onClick={() => onViewChange?.(item.id)}
          type="button"
        >
          <span className={['h-3.5 w-3.5 rounded-[4px]', activeView === item.id ? 'bg-accentSoft' : 'bg-line'].join(' ')} />
        </button>
      ))}
    </aside>
  );
}

function ProductTopBar({ activeView }: { activeView: ViewId }) {
  const label = sidebarItems.find((item) => item.id === activeView)?.label ?? '今日';
  return (
    <div className="flex items-center justify-between border-b border-line px-5 md:px-7">
      <p className="text-sm text-soft">
        <span className="font-semibold text-ink">{label}</span> / 私有工作区
      </p>
      <div className="flex gap-2" aria-hidden="true">
        <span className="size-8 rounded-full border border-line bg-white" />
        <span className="size-8 rounded-full border border-line bg-white" />
        <span className="hidden size-8 rounded-full border border-line bg-white sm:block" />
      </div>
    </div>
  );
}

function ProductShell({
  activeView,
  onViewChange,
  children,
}: {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="grid overflow-hidden rounded-[30px] border border-line bg-white shadow-product md:grid-cols-[76px_1fr]">
      <ProductSidebar activeView={activeView} onViewChange={onViewChange} />
      <div className="grid min-h-[620px] grid-rows-[58px_1fr] md:min-h-[620px]">
        <ProductTopBar activeView={activeView} />
        {children}
      </div>
    </section>
  );
}

function RecommendationCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className="flex aspect-[4/5] flex-col justify-between rounded-[26px] border border-line bg-[#f6f8f3] p-5">
      <span className="w-fit rounded-full bg-accentSoft px-3 py-2 text-xs font-bold text-accent">评分 86</span>
      <div className={['rounded-3xl border border-line bg-accentSoft/70', compact ? 'h-24' : 'h-32'].join(' ')} aria-hidden="true" />
      <h2 className="max-w-56 text-[26px] font-bold leading-none tracking-[-0.05em] text-ink">带具体证据的清单封面</h2>
    </article>
  );
}

function LandingShot() {
  return (
    <section
      aria-label="产品截图：今日复刻队列"
      className="grid min-h-[560px] overflow-hidden rounded-[30px] border border-line bg-white shadow-product md:grid-cols-[76px_1fr]"
    >
      <ProductSidebar activeView="today" />
      <div className="grid grid-rows-[58px_1fr]">
        <ProductTopBar activeView="today" />
        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <RecommendationCard />
          <NextAction />
        </div>
      </div>
    </section>
  );
}

function NextAction() {
  return (
    <div className="md:max-w-[290px]">
      <p className="text-[40px] font-bold leading-none tracking-[-0.055em] text-ink sm:text-[48px]">先写这条。</p>
      <p className="mt-5 text-base leading-7 text-muted">保留结构，把承诺替换成你的真实流程。先看收藏率，再看评论量。</p>

      <div className="mt-10 flex items-center justify-between gap-5 border-t border-line pt-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">下一步</p>
          <p className="mt-2 text-xl font-bold tracking-[-0.03em] text-ink">写 3 个标题版本</p>
        </div>
        <button
          aria-label="进入下一步"
          className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-2xl leading-none text-white transition active:translate-y-px"
          type="button"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <section className="grid items-center gap-10 py-10 md:grid-cols-[0.72fr_1.28fr] md:gap-11">
      <div className="max-w-[430px]">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">每周一个创作决策</p>
        <h1 className="mt-4 text-[clamp(40px,5vw,68px)] font-bold leading-[0.94] tracking-[-0.055em] text-ink [word-break:keep-all]">
          <span className="block">选出最该复刻的</span>
          <span className="block">那条热帖。</span>
        </h1>
        <p className="mt-5 text-lg leading-7 text-muted">把收藏的爆款内容，变成下一篇能发布的草稿。</p>
        <p className="mt-8 border-t border-line pt-5 text-sm leading-6 text-soft">
          <span className="font-semibold text-ink">已分类 14,820 条内容信号。</span>
          覆盖标题钩子、封面、评论需求和可复刻性。数据保留在你的本地工作区。
        </p>
      </div>

      <LandingShot />
    </section>
  );
}

function TodayPage() {
  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">今日只做一个决定</p>
        <h1 className="mt-4 max-w-[420px] text-[52px] font-bold leading-[0.95] tracking-[-0.06em] text-ink">本周先复刻这条。</h1>
        <p className="mt-5 max-w-[360px] text-base leading-7 text-muted">系统已经把可复刻性、评论需求和封面结构合并成一个排序结果。</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[260px_1fr] md:items-center">
        <RecommendationCard compact />
        <NextAction />
      </div>
    </div>
  );
}

function CoverArtwork({ featured = false, index, post }: { featured?: boolean; index: number; post: SavedPost }) {
  const accentBlocks = [
    'right-5 top-20 h-20 w-24 rounded-[24px] bg-accent/12',
    'right-5 top-20 h-28 w-14 rounded-full bg-ink/8',
    'right-5 top-20 h-16 w-28 rounded-[18px] bg-white/48',
    'right-5 top-20 h-24 w-20 rounded-[28px] bg-accent/10',
    'right-5 top-20 h-16 w-16 rounded-full bg-white/58',
    'right-5 top-20 h-24 w-24 rounded-[22px] border border-white/70',
  ];

  return (
    <div className={`relative h-full overflow-hidden rounded-[24px] border border-line bg-gradient-to-br ${post.palette}`}>
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/82 px-3 py-1.5 text-xs font-bold text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          {post.score}
        </span>
        <span className="max-w-[120px] truncate rounded-full bg-white/48 px-3 py-1.5 text-xs font-bold text-muted">{post.topic}</span>
      </div>

      <div className={`absolute ${accentBlocks[index % accentBlocks.length]}`} aria-hidden="true" />
      <div className="absolute left-5 top-[42%] h-px w-16 bg-ink/12" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white/62 to-white/0" aria-hidden="true" />

      <div className="absolute bottom-5 left-5 right-5">
        <h3
          className={[
            'max-w-[300px] font-bold leading-[0.98] tracking-[-0.055em] text-ink',
            featured ? 'text-[36px] sm:text-[44px]' : 'text-[24px] sm:text-[28px]',
          ].join(' ')}
        >
          {post.title}
        </h3>
      </div>
    </div>
  );
}

function ImageTile({
  featured = false,
  index,
  post,
  onClick,
}: {
  featured?: boolean;
  index: number;
  post: SavedPost;
  onClick: (post: SavedPost) => void;
}) {
  return (
    <button
      aria-label={`打开 ${post.title}`}
      className={[
        'group overflow-hidden rounded-[28px] border border-transparent bg-white p-2 text-left transition duration-300 ease-out',
        'hover:-translate-y-1 hover:scale-[1.018] hover:border-accent/45 hover:shadow-[0_22px_45px_-34px_rgba(24,24,27,0.55)]',
        'focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 active:translate-y-0 active:scale-[0.99]',
        featured ? 'col-span-2 row-span-2 h-auto md:col-span-2' : 'h-[178px] md:h-auto',
      ].join(' ')}
      onClick={() => onClick(post)}
      type="button"
    >
      <CoverArtwork featured={featured} index={index} post={post} />
    </button>
  );
}

function CoverWall({ onClick, posts }: { onClick: (post: SavedPost) => void; posts: SavedPost[] }) {
  return (
    <div className="grid auto-rows-[178px] grid-cols-2 gap-4 md:grid-cols-3 md:auto-rows-[190px]">
      {posts.map((post, index) => (
        <ImageTile featured={index === 0} index={index} key={post.id} post={post} onClick={onClick} />
      ))}
    </div>
  );
}

function ModeSwitch({ mode, onModeChange }: { mode: SavedMode; onModeChange: (mode: SavedMode) => void }) {
  const modes: Array<{ id: SavedMode; label: string }> = [
    { id: 'cover', label: '封面/首图' },
    { id: 'hook', label: '钩子' },
    { id: 'topic', label: '选题' },
  ];

  return (
    <div className="flex w-fit rounded-full border border-line bg-white p-1">
      {modes.map((item) => (
        <button
          aria-pressed={mode === item.id}
          className={[
            'min-h-9 rounded-full px-4 text-sm transition active:translate-y-px',
            mode === item.id ? 'bg-ink font-semibold text-white' : 'text-muted hover:text-ink',
          ].join(' ')}
          key={item.id}
          onClick={() => onModeChange(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function HookCard({ post, onClick }: { post: SavedPost; onClick: (post: SavedPost) => void }) {
  return (
    <button
      aria-label={`查看 ${post.title} 的钩子拆解`}
      className="group rounded-[28px] border border-line bg-[#fbfcfa] p-5 text-left transition duration-300 ease-out hover:-translate-y-1 hover:border-accent/45 hover:bg-white hover:shadow-[0_22px_45px_-34px_rgba(24,24,27,0.55)] focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 active:translate-y-0"
      onClick={() => onClick(post)}
      type="button"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-accentSoft px-3 py-1.5 text-xs font-bold text-accent">{post.score}</span>
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-soft">{post.topic}</span>
      </div>
      <h3 className="mt-5 text-2xl font-bold leading-tight tracking-[-0.04em] text-ink">{post.title}</h3>
      <div className="mt-5 space-y-2 text-sm leading-6 text-muted">
        {post.hookLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </button>
  );
}

function TopicCard({ topic, posts, onClick }: { topic: string; posts: SavedPost[]; onClick: (post: SavedPost) => void }) {
  const bestPost = posts.reduce((best, item) => (Number(item.score) > Number(best.score) ? item : best), posts[0]);

  return (
    <button
      aria-label={`查看 ${topic} 选题簇`}
      className="rounded-[30px] border border-line bg-[#fbfcfa] p-6 text-left transition duration-300 ease-out hover:-translate-y-1 hover:border-accent/45 hover:bg-white hover:shadow-[0_22px_45px_-34px_rgba(24,24,27,0.55)] focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 active:translate-y-0"
      onClick={() => onClick(bestPost)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[34px] font-bold leading-none tracking-[-0.055em] text-ink">{topic}</h3>
        <span className="rounded-full bg-accentSoft px-3 py-1.5 text-xs font-bold text-accent">{bestPost.topicCount} 条</span>
      </div>
      <p className="mt-8 text-sm font-bold uppercase tracking-[0.08em] text-soft">最高评分 {bestPost.score}</p>
      <p className="mt-3 text-lg font-bold leading-7 tracking-[-0.03em] text-ink">{bestPost.title}</p>
      <p className="mt-5 text-sm leading-6 text-muted">下一步：用这个选题，复刻最高分封面结构，改写前三行钩子。</p>
    </button>
  );
}

function TopicView({ onClick, posts }: { onClick: (post: SavedPost) => void; posts: SavedPost[] }) {
  const groups = posts.reduce<Record<string, SavedPost[]>>((result, post) => {
    result[post.topic] = [...(result[post.topic] ?? []), post];
    return result;
  }, {});

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(groups).map(([topic, posts]) => (
        <TopicCard key={topic} onClick={onClick} posts={posts} topic={topic} />
      ))}
    </div>
  );
}

function SavedDetailOverlay({
  post,
  onClose,
  onDraft,
}: {
  post: SavedPost;
  onClose: () => void;
  onDraft: (post: SavedPost) => void;
}) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-ink/20 px-5 py-7 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative grid w-[min(1120px,calc(100vw-40px))] gap-0 overflow-hidden rounded-[34px] border border-white/40 bg-white shadow-[0_42px_90px_-52px_rgba(24,24,27,0.76)] md:grid-cols-[0.95fr_1fr_0.9fr]">
        <button
          aria-label="关闭"
          className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-line bg-white text-xl leading-none text-muted transition hover:text-ink active:translate-y-px"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <div className="p-5 md:p-7">
          <div className="aspect-[4/5]">
            <CoverArtwork featured index={0} post={post} />
          </div>
        </div>

        <div className="border-y border-line p-6 md:border-x md:border-y-0 md:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">内容拆解</p>
          <h3 className="mt-5 text-[38px] font-bold leading-none tracking-[-0.055em] text-ink">{post.topic}</h3>
          <div className="mt-6 space-y-2 text-base leading-7 text-muted">
            {post.hookLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-line bg-[#fbfcfa] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">核心结构</p>
            <p className="mt-3 text-lg font-bold leading-7 tracking-[-0.03em] text-ink">{post.content}</p>
          </div>
        </div>

        <button
          aria-label={`进入 ${post.title} 的起稿页`}
          className="group flex flex-col justify-between bg-ink p-6 text-left text-white transition hover:bg-[#202024] active:scale-[0.995] md:p-8"
          onClick={() => onDraft(post)}
          type="button"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/45">草稿</p>
            <h3 className="mt-5 text-[36px] font-bold leading-none tracking-[-0.055em]">先生成一版标题。</h3>
            <p className="mt-6 text-base leading-7 text-white/70">{post.draft}</p>
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5">
            <span className="text-lg font-bold tracking-[-0.03em]">进入起稿页</span>
            <span className="grid size-12 place-items-center rounded-full bg-white text-2xl text-ink transition group-hover:translate-x-1">&gt;</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function SavedPage({ onDraft, posts }: { onDraft: (post: SavedPost) => void; posts: SavedPost[] }) {
  const detailFromQuery = new URLSearchParams(window.location.search).get('detail');
  const modeFromQuery = new URLSearchParams(window.location.search).get('mode');
  const [mode, setMode] = useState<SavedMode>(modeFromQuery === 'hook' || modeFromQuery === 'topic' ? modeFromQuery : 'cover');
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(
    detailFromQuery ? posts.find((post) => post.id === detailFromQuery) ?? null : null,
  );

  function handleModeChange(nextMode: SavedMode) {
    setMode(nextMode);
    const params = new URLSearchParams(window.location.search);
    params.set('view', 'saved');
    if (nextMode === 'cover') {
      params.delete('mode');
    } else {
      params.set('mode', nextMode);
    }
    params.delete('detail');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }

  return (
    <>
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <ModeSwitch mode={mode} onModeChange={handleModeChange} />
          <p className="hidden text-sm text-soft md:block">浏览时分开看，起稿时合并成一条创作指令。</p>
        </div>

        {mode === 'cover' ? (
          <CoverWall onClick={setSelectedPost} posts={posts} />
        ) : null}

        {mode === 'hook' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <HookCard key={post.id} post={post} onClick={setSelectedPost} />
            ))}
          </div>
        ) : null}

        {mode === 'topic' ? <TopicView onClick={setSelectedPost} posts={posts} /> : null}
      </div>
      {selectedPost ? <SavedDetailOverlay onClose={() => setSelectedPost(null)} onDraft={onDraft} post={selectedPost} /> : null}
    </>
  );
}

function DraftPage({ post = savedPosts[0] }: { post?: SavedPost }) {
  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded-[28px] border border-line bg-[#fbfcfa] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">原始热帖</p>
        <div className={`mt-8 h-40 rounded-[24px] border border-line bg-gradient-to-br ${post.palette}`} />
        <h2 className="mt-8 max-w-[280px] text-4xl font-bold leading-none tracking-[-0.055em] text-ink">{post.title}</h2>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">从拆解到草稿</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先写标题，不写全文。</h1>
        <p className="mt-5 max-w-[520px] text-base leading-7 text-muted">{post.draft}</p>
        <div className="mt-8 grid gap-3">
          {['3 个标题版本', '1 个封面承诺', '1 条开头结构'].map((item, index) => (
            <div className="flex items-center justify-between rounded-3xl border border-line bg-white p-5" key={item}>
              <span className="text-lg font-bold tracking-[-0.03em] text-ink">{item}</span>
              <span className="grid size-8 place-items-center rounded-full bg-accentSoft text-sm font-bold text-accent">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewPage() {
  return (
    <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[0.72fr_1.28fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">复盘只看关键反馈</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">这次复刻值得继续。</h1>
        <p className="mt-5 max-w-[360px] text-base leading-7 text-muted">复盘页不做复杂报表，只回答是否继续复刻、换角度，还是丢弃。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['31.4%', '保存到草稿'],
          ['18.7%', '标题复用提升'],
          ['4', '评论需求词'],
        ].map(([value, label]) => (
          <article className="rounded-[28px] border border-line bg-[#fbfcfa] p-5" key={label}>
            <p className="text-[42px] font-bold leading-none tracking-[-0.055em] text-ink">{value}</p>
            <p className="mt-4 text-sm text-soft">{label}</p>
          </article>
        ))}
        <article className="rounded-[28px] border border-line bg-ink p-6 text-white sm:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/45">下一轮动作</p>
          <p className="mt-4 max-w-[520px] text-3xl font-bold leading-tight tracking-[-0.04em]">保留清单结构，把封面证据改成更具体的前后对比。</p>
        </article>
      </div>
    </div>
  );
}

function ProductPage({
  activeView,
  onViewChange,
  selectedDraft,
  onDraft,
  importSession,
  onImportSessionReady,
  onImportSave,
  savedRoutePosts,
}: {
  activeView: Exclude<ViewId, 'landing'>;
  onViewChange: (view: ViewId) => void;
  selectedDraft?: SavedPost;
  onDraft: (post: SavedPost) => void;
  importSession: ImportSession | null;
  onImportSessionReady: (session: ImportSession) => void;
  onImportSave: (postSignal: PostSignal) => void;
  savedRoutePosts: SavedPost[];
}) {
  const content = useMemo(() => {
    if (activeView === 'import') {
      return importSession ? (
        <CorrectionWorkspace initialSession={importSession} onSave={onImportSave} onSessionChange={onImportSessionReady} />
      ) : (
        <ImportEntry onSessionReady={onImportSessionReady} />
      );
    }
    if (activeView === 'saved') return <SavedPage onDraft={onDraft} posts={savedRoutePosts} />;
    if (activeView === 'draft') return <DraftPage post={selectedDraft} />;
    if (activeView === 'review') return <ReviewPage />;
    return <TodayPage />;
  }, [activeView, importSession, onDraft, onImportSave, onImportSessionReady, savedRoutePosts, selectedDraft]);

  return (
    <section className="py-8">
      <ProductShell activeView={activeView} onViewChange={onViewChange}>
        {content}
      </ProductShell>
    </section>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>(getInitialView);
  const [selectedDraft, setSelectedDraft] = useState<SavedPost>(getInitialDraft);
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const { postSignals, savePostSignal } = useWorkspaceStore();
  const importedSavedPosts = useMemo(() => mapPostSignalsToSavedPosts(postSignals), [postSignals]);
  const savedRoutePosts = importedSavedPosts.length > 0 ? importedSavedPosts : savedPosts;

  function handleViewChange(view: ViewId) {
    setActiveView(view);
    const nextUrl = view === 'landing' ? window.location.pathname : `${window.location.pathname}?view=${view}`;
    window.history.replaceState(null, '', nextUrl);
  }

  function handleDraftFromSaved(post: SavedPost) {
    setSelectedDraft(post);
    setActiveView('draft');
    window.history.replaceState(null, '', `${window.location.pathname}?view=draft&post=${post.id}`);
  }

  function handleImportSave(postSignal: PostSignal) {
    savePostSignal(postSignal);
    setImportSession(null);
    setActiveView('saved');
    window.history.replaceState(null, '', `${window.location.pathname}?view=saved`);
  }

  return (
    <main className="min-h-[100dvh] bg-canvas">
      <div className="mx-auto grid min-h-[100dvh] w-[min(1200px,calc(100vw-36px))] grid-rows-[68px_1fr]">
        <TopNav activeView={activeView} onViewChange={handleViewChange} />
        {activeView === 'landing' ? (
          <LandingPage />
        ) : (
          <ProductPage
            activeView={activeView}
            importSession={importSession}
            onDraft={handleDraftFromSaved}
            onImportSave={handleImportSave}
            onImportSessionReady={setImportSession}
            onViewChange={handleViewChange}
            savedRoutePosts={savedRoutePosts}
            selectedDraft={selectedDraft}
          />
        )}
      </div>
    </main>
  );
}
