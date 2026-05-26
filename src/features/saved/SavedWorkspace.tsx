import { useEffect, useRef, useState } from 'react';
import { groupTopicClusters } from '../../domain/analysis';
import type { PostSignal, TopicCluster } from '../../domain/types';

type SavedMode = 'cover' | 'hook' | 'topic';

type SavedWorkspaceProps = {
  postSignals: PostSignal[];
  onDraft: (signal: PostSignal) => void;
};

const modes: Array<{ id: SavedMode; label: string }> = [
  { id: 'cover', label: '封面/首图' },
  { id: 'hook', label: '钩子' },
  { id: 'topic', label: '选题' },
];

const palettes = [
  'from-[#e6f4ef] via-[#f7faf5] to-[#dfeee9]',
  'from-[#edf2ea] via-[#fbfcf8] to-[#e7efe3]',
  'from-[#f0f1e8] via-[#fbfaf4] to-[#e8eee6]',
  'from-[#e7f1ef] via-[#f8faf7] to-[#eef2e8]',
  'from-[#e5f3ec] via-[#fbfcfa] to-[#edf3e8]',
  'from-[#eef4e7] via-[#fbfbf6] to-[#e6efeb]',
];

function ModeSwitch({ mode, onModeChange }: { mode: SavedMode; onModeChange: (mode: SavedMode) => void }) {
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

function CoverArtwork({ featured = false, index, signal }: { featured?: boolean; index: number; signal: PostSignal }) {
  const accentBlocks = [
    'right-5 top-20 h-20 w-24 rounded-[24px] bg-accent/12',
    'right-5 top-20 h-28 w-14 rounded-full bg-ink/8',
    'right-5 top-20 h-16 w-28 rounded-[18px] bg-white/48',
    'right-5 top-20 h-24 w-20 rounded-[28px] bg-accent/10',
    'right-5 top-20 h-16 w-16 rounded-full bg-white/58',
    'right-5 top-20 h-24 w-24 rounded-[22px] border border-white/70',
  ];

  return (
    <div className={`relative h-full overflow-hidden rounded-[24px] border border-line bg-gradient-to-br ${palettes[index % palettes.length]}`}>
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/82 px-3 py-1.5 text-xs font-bold text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          {signal.replicationScore}
        </span>
        <span className="max-w-[120px] truncate rounded-full bg-white/48 px-3 py-1.5 text-xs font-bold text-muted">{signal.topic}</span>
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
          {signal.title}
        </h3>
      </div>
    </div>
  );
}

function CoverWall({ onClick, postSignals }: { onClick: (signal: PostSignal) => void; postSignals: PostSignal[] }) {
  return (
    <div className="grid auto-rows-[178px] grid-cols-2 gap-4 md:grid-cols-3 md:auto-rows-[190px]">
      {postSignals.map((signal, index) => (
        <button
          aria-label={`打开 ${signal.title}`}
          className={[
            'group overflow-hidden rounded-[28px] border border-transparent bg-white p-2 text-left transition duration-300 ease-out',
            'hover:-translate-y-1 hover:scale-[1.018] hover:border-accent/45 hover:shadow-[0_22px_45px_-34px_rgba(24,24,27,0.55)]',
            'focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 active:translate-y-0 active:scale-[0.99]',
            index === 0 ? 'col-span-2 row-span-2 h-auto md:col-span-2' : 'h-[178px] md:h-auto',
          ].join(' ')}
          key={signal.id}
          onClick={() => onClick(signal)}
          type="button"
        >
          <CoverArtwork featured={index === 0} index={index} signal={signal} />
        </button>
      ))}
    </div>
  );
}

function HookCard({ onClick, signal }: { onClick: (signal: PostSignal) => void; signal: PostSignal }) {
  return (
    <button
      aria-label={`查看 ${signal.title} 的钩子拆解`}
      className="group rounded-[28px] border border-line bg-[#fbfcfa] p-5 text-left transition duration-300 ease-out hover:-translate-y-1 hover:border-accent/45 hover:bg-white hover:shadow-[0_22px_45px_-34px_rgba(24,24,27,0.55)] focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 active:translate-y-0"
      onClick={() => onClick(signal)}
      type="button"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-accentSoft px-3 py-1.5 text-xs font-bold text-accent">{signal.replicationScore}</span>
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-soft">{signal.topic}</span>
      </div>
      <h3 className="mt-5 text-2xl font-bold leading-tight tracking-[-0.04em] text-ink">{signal.title}</h3>
      <div className="mt-5 space-y-2 text-sm leading-6 text-muted">
        {signal.hookLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </button>
  );
}

function TopicCard({
  cluster,
  onClick,
  signal,
}: {
  cluster: TopicCluster;
  onClick: (signal: PostSignal) => void;
  signal: PostSignal;
}) {
  return (
    <button
      aria-label={`查看 ${cluster.name} 选题簇`}
      className="rounded-[30px] border border-line bg-[#fbfcfa] p-6 text-left transition duration-300 ease-out hover:-translate-y-1 hover:border-accent/45 hover:bg-white hover:shadow-[0_22px_45px_-34px_rgba(24,24,27,0.55)] focus:outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/10 active:translate-y-0"
      onClick={() => onClick(signal)}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[34px] font-bold leading-none tracking-[-0.055em] text-ink">{cluster.name}</h3>
        <span className="rounded-full bg-accentSoft px-3 py-1.5 text-xs font-bold text-accent">{cluster.postCount} 条</span>
      </div>
      <p className="mt-8 text-sm font-bold uppercase tracking-[0.08em] text-soft">平均评分 {cluster.averageScore}</p>
      <p className="mt-3 text-lg font-bold leading-7 tracking-[-0.03em] text-ink">{signal.title}</p>
      <p className="mt-5 text-sm leading-6 text-muted">{signal.recommendedNextAction}</p>
    </button>
  );
}

function SavedDetailOverlay({
  onClose,
  onDraft,
  signal,
}: {
  onClose: () => void;
  onDraft: (signal: PostSignal) => void;
  signal: PostSignal;
}) {
  const titleId = `saved-detail-title-${signal.id}`;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
    ).filter((element) => !element.hasAttribute('disabled'));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-20 grid place-items-center bg-ink/20 px-5 py-7 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      ref={dialogRef}
      role="dialog"
    >
      <div className="relative grid w-[min(1120px,calc(100vw-40px))] gap-0 overflow-hidden rounded-[34px] border border-white/40 bg-white shadow-[0_42px_90px_-52px_rgba(24,24,27,0.76)] md:grid-cols-[0.95fr_1fr_0.9fr]">
        <button
          aria-label="关闭"
          className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-line bg-white text-xl leading-none text-muted transition hover:text-ink active:translate-y-px"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          x
        </button>

        <div className="p-5 md:p-7">
          <h2 className="sr-only" id={titleId}>
            {signal.title}
          </h2>
          <div className="aspect-[4/5]">
            <CoverArtwork featured index={0} signal={signal} />
          </div>
        </div>

        <div className="border-y border-line p-6 md:border-x md:border-y-0 md:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">内容拆解</p>
          <h3 className="mt-5 text-[38px] font-bold leading-none tracking-[-0.055em] text-ink">{signal.topic}</h3>
          <div className="mt-6 space-y-2 text-base leading-7 text-muted">
            {signal.hookLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-line bg-[#fbfcfa] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">核心结构</p>
            <p className="mt-3 text-lg font-bold leading-7 tracking-[-0.03em] text-ink">{signal.draftSeed}</p>
          </div>
        </div>

        <button
          aria-label={`进入 ${signal.title} 的起稿页`}
          className="group flex flex-col justify-between bg-ink p-6 text-left text-white transition hover:bg-[#202024] active:scale-[0.995] md:p-8"
          onClick={() => onDraft(signal)}
          type="button"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/45">草稿</p>
            <h3 className="mt-5 text-[36px] font-bold leading-none tracking-[-0.055em]">先生成一版标题。</h3>
            <p className="mt-6 text-base leading-7 text-white/70">{signal.recommendedNextAction}</p>
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

export function SavedWorkspace({ postSignals, onDraft }: SavedWorkspaceProps) {
  const [mode, setMode] = useState<SavedMode>('cover');
  const [selected, setSelected] = useState<PostSignal | null>(null);
  const clusters = groupTopicClusters(postSignals);
  const signalsById = new Map(postSignals.map((signal) => [signal.id, signal]));

  if (postSignals.length === 0) {
    return (
      <section className="p-5 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">收藏</p>
        <h1 className="mt-4 max-w-[520px] text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先导入一条热帖。</h1>
        <p className="mt-5 max-w-[420px] text-base leading-7 text-muted">保存后的内容信号会按封面、钩子和选题三种视角整理在这里。</p>
      </section>
    );
  }

  return (
    <>
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <ModeSwitch mode={mode} onModeChange={setMode} />
          <p className="hidden text-sm text-soft md:block">浏览时分开看，起稿时合并成一条创作指令。</p>
        </div>

        {mode === 'cover' ? <CoverWall onClick={setSelected} postSignals={postSignals} /> : null}

        {mode === 'hook' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {postSignals.map((signal) => (
              <HookCard key={signal.id} onClick={setSelected} signal={signal} />
            ))}
          </div>
        ) : null}

        {mode === 'topic' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clusters.map((cluster) => {
              const bestSignal = signalsById.get(cluster.bestPostSignalId);
              return bestSignal ? <TopicCard cluster={cluster} key={cluster.id} onClick={setSelected} signal={bestSignal} /> : null;
            })}
          </div>
        ) : null}
      </div>

      {selected ? <SavedDetailOverlay onClose={() => setSelected(null)} onDraft={onDraft} signal={selected} /> : null}
    </>
  );
}
