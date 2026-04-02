import { useAppStore } from '../store/useAppStore';

export default function Inspector() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const selectedMedia = mediaItems.find((item) => item.id === selectedMediaId) ?? {};

  return (
    <aside className="w-[320px] shrink-0 border-l border-white/10 bg-medexInspector p-4 text-medexText">
      <h2 className="mb-3 text-base font-medium">Inspector</h2>
      <div className="rounded border border-white/10 p-4 text-sm text-white/80">
        <p className="mb-3">选择的媒体信息</p>
        <pre className="overflow-auto rounded bg-black/20 p-3 text-xs text-white/70">
          {JSON.stringify(selectedMedia, null, 2)}
        </pre>
      </div>
    </aside>
  );
}
