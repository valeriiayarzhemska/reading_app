import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type CoverSource = 'camera' | 'library';

export type PickResult =
  | { status: 'picked'; uri: string }
  | { status: 'canceled' }
  | { status: 'denied' };

const COVER_RATIO = 7 / 10;
// Twice the largest size we show (lg = 128 pt) on a 3x screen is plenty;
// keeps the JPEG around 100–300 KB
const COVER_WIDTH = 700;

export async function pickImage(source: CoverSource): Promise<PickResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    // Android's crop screen honours the 7:10 aspect; iOS can only crop to a
    // square, so there we skip it and crop to 7:10 ourselves
    allowsEditing: Platform.OS === 'android',
    aspect: [7, 10],
    quality: 1,
  };

  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return { status: 'denied' };
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) {
    return { status: 'canceled' };
  }

  return { status: 'picked', uri: result.assets[0].uri };
}

// Crops the middle 7:10 part, shrinks it and saves a JPEG. Returns a local
// file:// URI; nothing is uploaded until the book is saved.
export async function prepareCover(uri: string): Promise<string> {
  // Rendered once first to learn the real size: the picker's width/height
  // can be 0 for some files
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const crop = centerCrop(original.width, original.height);

  const context = ImageManipulator.manipulate(uri)
    .crop(crop)
    .resize({ width: Math.min(COVER_WIDTH, crop.width) });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  });

  return saved.uri;
}

function centerCrop(width: number, height: number) {
  // Wider than 7:10: keep the full height, trim the sides
  if (width / height > COVER_RATIO) {
    const cropWidth = Math.round(height * COVER_RATIO);

    return {
      originX: Math.round((width - cropWidth) / 2),
      originY: 0,
      width: cropWidth,
      height,
    };
  }

  // Taller: keep the full width, trim top and bottom
  const cropHeight = Math.round(width / COVER_RATIO);

  return {
    originX: 0,
    originY: Math.round((height - cropHeight) / 2),
    width,
    height: cropHeight,
  };
}
