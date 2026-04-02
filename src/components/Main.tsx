import MediaGridContainer from '../containers/MediaGridContainer';

export default function Main() {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-medexMain p-6 text-medexText">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Media Grid</h2>
        <span className="text-xs text-white/60">Click a card to select</span>
      </header>

      <MediaGridContainer />
    </main>
  );
}
