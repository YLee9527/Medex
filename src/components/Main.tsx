import MediaGridContainer from '../containers/MediaGridContainer';
import { useAppStore } from '../store/useAppStore';

export default function Main() {
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-medexMain p-6 text-medexText">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Media Grid</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded px-3 py-1 text-xs transition-colors ${
              viewMode === 'grid' ? 'bg-[#444444] text-white' : 'bg-white/10 text-white/75 hover:bg-white/20'
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded px-3 py-1 text-xs transition-colors ${
              viewMode === 'list' ? 'bg-[#444444] text-white' : 'bg-white/10 text-white/75 hover:bg-white/20'
            }`}
          >
            List
          </button>
        </div>
      </header>

      <div className="flex flex-1 rounded border border-dashed border-white/20 p-4">
        <MediaGridContainer />
      </div>
    </main>
  );
}
