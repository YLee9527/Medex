import MediaCard from './MediaCard';
import { MediaItem } from '../store/useAppStore';

export interface MediaGridProps {
  items: MediaItem[];
  selectedId: string;
  onCardClick: (id: string) => void;
}

export default function MediaGrid({ items, selectedId, onCardClick }: MediaGridProps) {
  return (
    <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 rounded border border-dashed border-white/20 p-4">
      {items.map((item) => (
        <div key={item.id} className="flex justify-start">
          <MediaCard
            id={item.id}
            thumbnail={item.thumbnail}
            filename={item.filename}
            tags={item.tags}
            selected={selectedId === item.id}
            onClick={onCardClick}
          />
        </div>
      ))}
    </div>
  );
}
