import Inspector from '../components/Inspector';
import { MediaCardProps } from '../components/MediaCard';
import { useAppStore } from '../store/useAppStore';
import { useThemeContext } from '../contexts/ThemeContext';

export default function InspectorContainer() {
  const mediaItems = useAppStore((state) => state.mediaItems);
  const selectedMediaId = useAppStore((state) => state.selectedMediaId);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const deleteMedia = useAppStore((state) => state.deleteMedia);
  const { theme } = useThemeContext();

  const selectedMedia = mediaItems.find((item) => item.id === selectedMediaId);

  const media: MediaCardProps | null = selectedMedia
    ? {
        ...selectedMedia,
        selected: true,
        onClick: () => {},
        theme
      }
    : null;

  return (
    <Inspector
      media={media}
      onToggleFavorite={toggleFavorite}
      onDeleteMedia={deleteMedia}
    />
  );
}
