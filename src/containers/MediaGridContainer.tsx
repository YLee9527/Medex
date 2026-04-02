import MediaGrid from '../components/MediaGrid';
import { useAppStore } from '../store/useAppStore';

export default function MediaGridContainer() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const clickMedia = useAppStore((state) => state.clickMedia);

  return <MediaGrid items={mediaItems} selectedId={selectedMediaId} onCardClick={clickMedia} />;
}
