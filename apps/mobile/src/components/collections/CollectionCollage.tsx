import { View } from 'react-native';

import { COLLAGE_SIZE } from '@reading/shared';

import { RemoteImage } from '@/components/ui/RemoteImage';

interface CollectionCollageProps {
  // In order; fewer than 4 leaves empty tiles
  covers: (string | null)[];
  // Width of the whole collage; tiles keep the 7:10 cover shape
  width: number;
}

const GAP = 2;

// The collection's cover: its first four books in a 2×2 grid
export function CollectionCollage({ covers, width }: CollectionCollageProps) {
  const tileWidth = (width - GAP) / 2;
  const tileHeight = tileWidth / 0.7;
  const tiles = Array.from(
    { length: COLLAGE_SIZE },
    (_, index) => covers[index] ?? null,
  );

  return (
    <View
      className="flex-row flex-wrap overflow-hidden rounded-xl bg-card"
      style={{ width, gap: GAP }}
    >
      {tiles.map((cover, index) =>
        cover ? (
          <RemoteImage
            key={index}
            uri={cover}
            style={{ width: tileWidth, height: tileHeight }}
          />
        ) : (
          <View
            key={index}
            className="bg-card-strong"
            style={{ width: tileWidth, height: tileHeight }}
          />
        ),
      )}
    </View>
  );
}
