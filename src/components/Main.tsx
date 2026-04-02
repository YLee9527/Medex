import MediaGridContainer from '../containers/MediaGridContainer';
import ToolbarContainer from '../containers/ToolbarContainer';

export default function Main() {
  return (
    <main className="flex min-w-0 flex-1 flex-col bg-medexMain p-6 text-medexText">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Media Grid</h2>
      </header>

      <div className="mb-4">
        <ToolbarContainer />
      </div>

      <div className="flex flex-1 rounded border border-dashed border-white/20 p-4">
        <MediaGridContainer />
      </div>
    </main>
  );
}
