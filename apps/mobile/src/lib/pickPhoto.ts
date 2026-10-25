import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Wide enough for a full-width bubble on a 3x screen; keeps the JPEG to a
// few hundred KB instead of a 5 MB camera original
const PHOTO_MAX_WIDTH = 1280;

// Picks a photo from the library and returns a shrunk local JPEG, or null
// when the picker was cancelled. Nothing is uploaded here.
export async function pickPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  const { uri } = result.assets[0];
  // Rendered once to learn the real size: the picker's width can be 0 for
  // some files (as with covers)
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  let context = ImageManipulator.manipulate(uri);

  // Only shrink: a small image stays as it is
  if (original.width > PHOTO_MAX_WIDTH) {
    context = context.resize({ width: PHOTO_MAX_WIDTH });
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  });

  return saved.uri;
}
