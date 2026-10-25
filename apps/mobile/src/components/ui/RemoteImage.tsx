import { Image, type ImageProps } from 'expo-image';

interface RemoteImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
}

// expo-image with the defaults every network image here needs.
// memory-disk: scrolling back shows a decoded image instead of reading the
// file again. recyclingKey: FlashList reuses cells, and without it a reused
// cell briefly shows the previous image.
export function RemoteImage({ uri, ...props }: RemoteImageProps) {
  return (
    <Image
      source={uri}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      contentFit="cover"
      {...props}
    />
  );
}
