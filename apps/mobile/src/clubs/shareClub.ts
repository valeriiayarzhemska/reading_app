import { Share } from 'react-native';

import * as Linking from 'expo-linking';

import type { TFunction } from 'i18next';

// The system share sheet: Messages, Telegram, Copy… A readingapp:// link
// opens the room where the app is installed; web links come with the deploy.
export function shareClub(club: { id: string; name: string }, t: TFunction) {
  const url = Linking.createURL(`clubs/${club.id}`);

  void Share.share({
    message: t('clubs.info.shareMessage', { name: club.name, url }),
  });
}
