import Inspector from '../components/Inspector';
import { MediaCardProps } from '../components/MediaCard';
import { useAppStore } from '../store/useAppStore';

export default function InspectorContainer() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const changeSelectedMediaTag = useAppStore((state) => state.changeSelectedMediaTag);

  const selectedMedia = mediaItems.find((item) => item.id === selectedMediaId);

  const media: MediaCardProps | null = selectedMedia
    ? {
        ...selectedMedia,
        selected: true,
        onClick: () => {}
      }
    : null;

  return <Inspector media={media} onTagChange={changeSelectedMediaTag} />;
}
