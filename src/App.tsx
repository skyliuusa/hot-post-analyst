import { useMemo, useState } from 'react';

type ViewId = 'landing' | 'today' | 'saved' | 'draft' | 'review';

const views: Array<{ id: ViewId; label: string }> = [
  { id: 'landing', label: '首页' },
  { id: 'today', label: '今日' },
  { id: 'saved', label: '收藏' },
  { id: 'draft', label: '起稿' },
  { id: 'review', label: '复盘' },
];

const sidebarItems: Array<{ id: ViewId; label: string }> = [
  { id: 'today', label: '今日' },
  { id: 'saved', label: '收藏' },
  { id: 'draft', label: '起稿' },
  { id: 'review', label: '复盘' },
];

function getInitialView(): ViewId {
  const view = new URLSearchParams(window.location.search).get('view');
  return views.some((item) => item.id === view) ? (view as ViewId) : 'landing';
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

function SavedPage() {
  const posts = [
    ['86', '带具体证据的清单封面', '高收藏意图'],
    ['79', '评论区反复问同一个问题', '强需求信号'],
    ['74', '反差式封面标题组合', '适合改写'],
    ['68', '同题多平台升温', '周四前验证'],
  ];

  return (
    <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[0.62fr_1.38fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">只看可行动收藏</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">收藏不是素材库。</h1>
        <p className="mt-5 max-w-[340px] text-base leading-7 text-muted">这里不展示所有内容，只展示最可能变成下一篇草稿的信号。</p>
      </div>

      <div className="grid gap-3">
        {posts.map(([score, title, tag]) => (
          <article className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-3xl border border-line bg-[#fbfcfa] p-4" key={title}>
            <div className="grid size-14 place-items-center rounded-2xl bg-accentSoft text-sm font-bold text-accent">{score}</div>
            <div>
              <p className="text-lg font-bold tracking-[-0.03em] text-ink">{title}</p>
              <p className="mt-1 text-sm text-soft">{tag}</p>
            </div>
            <span className="hidden rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-muted sm:block">可复刻</span>
          </article>
        ))}
      </div>
    </div>
  );
}

function DraftPage() {
  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded-[28px] border border-line bg-[#fbfcfa] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">原始热帖</p>
        <div className="mt-8 h-40 rounded-[24px] border border-line bg-accentSoft/70" />
        <h2 className="mt-8 max-w-[280px] text-4xl font-bold leading-none tracking-[-0.055em] text-ink">带具体证据的清单封面</h2>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">从拆解到草稿</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先写标题，不写全文。</h1>
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

function ProductPage({ activeView, onViewChange }: { activeView: Exclude<ViewId, 'landing'>; onViewChange: (view: ViewId) => void }) {
  const content = useMemo(() => {
    if (activeView === 'saved') return <SavedPage />;
    if (activeView === 'draft') return <DraftPage />;
    if (activeView === 'review') return <ReviewPage />;
    return <TodayPage />;
  }, [activeView]);

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

  function handleViewChange(view: ViewId) {
    setActiveView(view);
    const nextUrl = view === 'landing' ? window.location.pathname : `${window.location.pathname}?view=${view}`;
    window.history.replaceState(null, '', nextUrl);
  }

  return (
    <main className="min-h-[100dvh] bg-canvas">
      <div className="mx-auto grid min-h-[100dvh] w-[min(1200px,calc(100vw-36px))] grid-rows-[68px_1fr]">
        <TopNav activeView={activeView} onViewChange={handleViewChange} />
        {activeView === 'landing' ? <LandingPage /> : <ProductPage activeView={activeView} onViewChange={handleViewChange} />}
      </div>
    </main>
  );
}
