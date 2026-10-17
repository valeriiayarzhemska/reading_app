import type { UserBookWithBook } from '@reading/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { StartSessionSheet } from '@/components/timer/start-session-sheet';
import { Button } from '@/components/ui/button';
import { useActiveSession } from '@/timer/use-active-session';

interface StartSessionButtonProps {
  entry: UserBookWithBook;
  className?: string;
}

export function StartSessionButton({
  entry,
  className,
}: StartSessionButtonProps) {
  const { t } = useTranslation();
  const { session } = useActiveSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isThisBook = session?.userBookId === entry.id;

  // One session at a time: a second timer would double-count the time
  function onPress() {
    if (!session) {
      setIsSheetOpen(true);

      return;
    }

    if (isThisBook) {
      router.push('/timer');

      return;
    }

    Alert.alert(
      t('timer.busyTitle'),
      t('timer.busyMessage', { title: session.book.title }),
      [
        { text: t('book.cancel'), style: 'cancel' },
        { text: t('timer.open'), onPress: () => router.push('/timer') },
      ],
    );
  }

  return (
    <>
      <Button
        title={isThisBook ? t('timer.open') : t('timer.startButton')}
        onPress={onPress}
        className={className}
      />

      <StartSessionSheet
        entry={entry}
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}
