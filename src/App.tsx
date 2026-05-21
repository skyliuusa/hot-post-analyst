const sidebarItems = ['今日', '收藏', '草稿', '复盘'];

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

function Sidebar() {
  return (
    <aside aria-label="产品功能导航" className="flex flex-col items-center gap-3 border-r border-line bg-[#fbfcfa] px-3 py-8">
      {sidebarItems.map((item, index) => (
        <button
          aria-label={item}
          className={[
            'grid size-11 place-items-center rounded-2xl border transition active:translate-y-px',
            index === 0 ? 'border-ink bg-ink' : 'border-line bg-white',
          ].join(' ')}
          key={item}
          type="button"
        >
          <span className={['h-3.5 w-3.5 rounded-[4px]', index === 0 ? 'bg-accentSoft' : 'bg-line'].join(' ')} />
        </button>
      ))}
    </aside>
  );
}

function ProductShot() {
  return (
    <section
      aria-label="产品截图：今日复刻队列"
      className="grid min-h-[560px] overflow-hidden rounded-[30px] border border-line bg-white shadow-product md:grid-cols-[76px_1fr]"
    >
      <Sidebar />

      <div className="grid grid-rows-[58px_1fr]">
        <div className="flex items-center justify-between border-b border-line px-5 md:px-7">
          <p className="text-sm text-soft">
            <span className="font-semibold text-ink">今日</span> / 复刻队列
          </p>
          <div className="flex gap-2" aria-hidden="true">
            <span className="size-8 rounded-full border border-line bg-white" />
            <span className="size-8 rounded-full border border-line bg-white" />
            <span className="hidden size-8 rounded-full border border-line bg-white sm:block" />
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <article className="flex aspect-[4/5] flex-col justify-between rounded-[26px] border border-line bg-[#f6f8f3] p-5">
            <span className="w-fit rounded-full bg-accentSoft px-3 py-2 text-xs font-bold text-accent">评分 86</span>
            <div className="h-32 rounded-3xl border border-line bg-accentSoft/70" aria-hidden="true" />
            <h2 className="max-w-56 text-[26px] font-bold leading-none tracking-[-0.05em] text-ink">带具体证据的清单封面</h2>
          </article>

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
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <main className="min-h-[100dvh] bg-canvas">
      <div className="mx-auto grid min-h-[100dvh] w-[min(1200px,calc(100vw-36px))] grid-rows-[68px_1fr]">
        <nav className="flex items-center justify-between border-b border-line" aria-label="主导航">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-[9px] bg-ink" aria-hidden="true" />
            <span className="font-bold tracking-[-0.03em] text-ink">Hot Post Analyst</span>
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

          <ProductShot />
        </section>
      </div>
    </main>
  );
}
