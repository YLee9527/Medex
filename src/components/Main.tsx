export default function Main() {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-medexMain p-6 text-medexText">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Media Grid</h2>
        <span className="text-xs text-white/60">Placeholder</span>
      </header>

      <div className="grid flex-1 grid-cols-2 gap-4 rounded border border-dashed border-white/20 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex aspect-video items-center justify-center rounded border border-white/10 bg-white/5 text-sm text-white/70"
          >
            Media {idx + 1}
          </div>
        ))}
      </div>
    </main>
  );
}
