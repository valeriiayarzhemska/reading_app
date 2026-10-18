import { Directory, File, Paths } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';

const PREFIX = 'cover-';

// iOS widgets run in their own process: they can't use the network or read
// the app's files, only the shared App Group folder. Android's notification
// is built by our own module, so the app's cache folder is enough there.
// (expo-widgets is a stub on Android: widgetsDirectory is empty.)
function coversFolder(): Directory {
  if (widgetsDirectory) {
    return new Directory(widgetsDirectory);
  }

  const folder = new Directory(Paths.cache, 'widget-covers');

  if (!folder.exists) {
    folder.create();
  }

  return folder;
}

// The timer (Live Activity / notification) and the home screen widget can
// show different books, so each keeps its own cover
export type CoverSlot = 'activity' | 'home';

// Downloads the cover once per book and removes the slot's other covers.
// Returns its file:// path, or null (no cover, or the download failed: the
// widget then shows an icon).
export async function prepareWidgetCover(
  slot: CoverSlot,
  userBookId: string,
  coverUrl: string | null,
): Promise<string | null> {
  if (!coverUrl) {
    return null;
  }

  try {
    const folder = coversFolder();
    const prefix = `${PREFIX}${slot}-`;
    const name = `${prefix}${userBookId}.jpg`;
    const file = new File(folder, name);

    for (const item of folder.list()) {
      if (
        item instanceof File &&
        item.name.startsWith(prefix) &&
        item.name !== name
      ) {
        item.delete();
      }
    }

    if (!file.exists) {
      await File.downloadFileAsync(coverUrl, file, { idempotent: true });
    }

    return file.uri;
  } catch {
    return null;
  }
}
