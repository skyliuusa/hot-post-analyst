import { buildDraftBrief } from '../../domain/analysis';
import type { DraftBrief, PostSignal } from '../../domain/types';

type DraftWorkspaceProps = {
  signal?: PostSignal;
  onSaveBrief: (brief: DraftBrief) => void;
};

export function DraftWorkspace({ signal, onSaveBrief }: DraftWorkspaceProps) {
  if (!signal) {
    return (
      <section className="p-5 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">从拆解到草稿</p>
        <h1 className="mt-4 max-w-[520px] text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先选择一条素材。</h1>
        <p className="mt-5 max-w-[420px] text-base leading-7 text-muted">从收藏页打开一条热帖信号后，这里会生成标题、封面承诺和开头结构。</p>
      </section>
    );
  }

  const brief = buildDraftBrief(signal, `brief-${signal.id}`);

  return (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded-[28px] border border-line bg-[#fbfcfa] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">原始热帖</p>
        <div className="mt-8 h-40 rounded-[24px] border border-line bg-gradient-to-br from-[#e6f4ef] via-[#f7faf5] to-[#dfeee9]" />
        <h2 className="mt-8 max-w-[320px] text-4xl font-bold leading-none tracking-[-0.055em] text-ink">{signal.title}</h2>
        <p className="mt-5 text-sm leading-6 text-muted">{signal.recommendedNextAction}</p>
      </div>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">从拆解到草稿</p>
        <h1 className="mt-4 text-[48px] font-bold leading-[0.96] tracking-[-0.055em] text-ink">先写标题，不写全文。</h1>
        <p className="mt-5 max-w-[520px] text-base leading-7 text-muted">{brief.coverPromise}</p>

        <div className="mt-8 grid gap-3">
          {brief.titleOptions.map((title, index) => (
            <article className="flex items-start justify-between gap-4 rounded-3xl border border-line bg-white p-5" key={title}>
              <p className="text-lg font-bold leading-7 tracking-[-0.03em] text-ink">{title}</p>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accentSoft text-sm font-bold text-accent">{index + 1}</span>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[28px] border border-line bg-[#fbfcfa] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-soft">开头结构</p>
          <p className="mt-3 whitespace-pre-line text-base font-semibold leading-7 tracking-[-0.02em] text-ink">{brief.openingHook}</p>
        </div>

        <button
          className="mt-5 min-h-12 rounded-full bg-ink px-6 text-sm font-bold text-white transition active:translate-y-px"
          onClick={() => onSaveBrief(brief)}
          type="button"
        >
          保存草稿 brief
        </button>
      </div>
    </div>
  );
}
