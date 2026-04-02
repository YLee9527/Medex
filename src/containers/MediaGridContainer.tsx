import MediaGrid from '../components/MediaGrid';
import { MediaCardProps } from '../components/MediaCard';
import { useAppStore } from '../store/useAppStore';

export default function MediaGridContainer() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const clickMedia = useAppStore((state) => state.clickMedia);
  const viewMode = useAppStore((state) => state.viewMode);

  const mediaList: MediaCardProps[] = mediaItems.map((item) => ({
    ...item,
    selected: item.id === selectedMediaId,
    onClick: () => {}
  }));

  return <MediaGrid mediaList={mediaList} onCardClick={clickMedia} viewMode={viewMode} />;
}
