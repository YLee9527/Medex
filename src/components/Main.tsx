import MediaGridContainer from '../containers/MediaGridContainer';
import ToolbarContainer from '../containers/ToolbarContainer';

interface MainProps {
  onOpenViewer: (mediaId: string) => void;
}

export default function Main({ onOpenViewer }: MainProps) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-medexMain p-6 text-medexText">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Media Grid</h2>
      </header>

      <div className="mb-4">
        <ToolbarContainer />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded border border-dashed border-white/20 p-4">
        <MediaGridContainer onOpenViewer={onOpenViewer} />
      </div>
    </main>
  );
}
