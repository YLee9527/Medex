import MediaCard, { MediaCardProps } from './MediaCard';

export interface MediaGridProps {
  mediaList: MediaCardProps[];
  onCardClick: (id: string) => void;
  viewMode: 'grid' | 'list';
}

export default function MediaGrid({ mediaList, onCardClick, viewMode }: MediaGridProps) {
  const layoutClassName =
    viewMode === 'grid'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5'
      : 'flex flex-col gap-2';

  return (
    <div className={`flex-1 ${layoutClassName}`}>
      {mediaList.map((item) => (
        <div key={item.id} className={viewMode === 'grid' ? 'flex justify-start' : 'w-full'}>
          <MediaCard
            {...item}
            onClick={onCardClick}
            className={viewMode === 'list' ? 'w-full' : 'w-[180px]'}
          />
        </div>
      ))}
    </div>
  );
}
