/** Numbered section header, matching the Sidequests site ("03  CAIRNS"). */
export function SectionTitle({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="mb-12">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-lg font-semibold text-sea">{n}</span>
        <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight leading-none text-ink">
          {title}
        </h2>
      </div>
      {sub && <p className="mt-4 text-xl text-ink-soft">{sub}</p>}
    </div>
  );
}
