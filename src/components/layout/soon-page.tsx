export default function SoonPage({ title }: { title: string }) {
  return (
    <section className="bg-surface-1 rounded-[28px] p-8">
      <h1 className="text-4xl font-semibold">{title}</h1>
      <p className="text-muted mt-3">Disponible en una fase siguiente.</p>
    </section>
  );
}
