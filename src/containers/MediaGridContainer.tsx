import MediaGrid from '../components/MediaGrid';
import { MediaCardProps } from '../components/MediaCard';
import { useAppStore } from '../store/useAppStore';

export default function MediaGridContainer() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const navItems = useAppStore((state) => state.navItems);
  const tags = useAppStore((state) => state.tags);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const clickMedia = useAppStore((state) => state.clickMedia);
  const viewMode = useAppStore((state) => state.viewMode);

  const activeNavId = navItems.find((item) => item.active)?.id ?? 'all-media';
  const selectedTagNames = tags.filter((tag) => tag.selected).map((tag) => tag.name);

  const navFilteredMediaItems = mediaItems.filter((item) => {
    if (activeNavId === 'favorites') {
      return item.isFavorite;
    }
    if (activeNavId === 'recent') {
      return item.isRecent;
    }
    return true;
  });

  const filteredMediaItems =
    selectedTagNames.length === 0
      ? navFilteredMediaItems
      : navFilteredMediaItems.filter((item) => selectedTagNames.every((tagName) => item.tags.includes(tagName)));

  const mediaList: MediaCardProps[] = filteredMediaItems.map((item) => ({
    ...item,
    selected: item.id === selectedMediaId,
    onClick: () => {}
  }));

  return <MediaGrid mediaList={mediaList} onCardClick={clickMedia} viewMode={viewMode} />;
}
