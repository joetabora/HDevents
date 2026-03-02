export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-10 flex flex-wrap items-start justify-between gap-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-[#A1A1AA]">{subtitle}</p> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </header>
  );
}
