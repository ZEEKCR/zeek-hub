/** Shown while a screen loads, so the page never goes blank. */
export default function AppLoading() {
  const block = "bg-surface-2 animate-pulse rounded-[20px]";
  return (
    <div className="grid gap-6" role="status" aria-label="Cargando">
      <div className="grid gap-2.5">
        <div className={`${block} h-9 w-56`} />
        <div className={`${block} h-4 w-80 max-w-full`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`${block} h-24`} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className={`${block} h-72`} />
        <div className={`${block} h-72`} />
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
