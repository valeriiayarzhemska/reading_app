import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  minutesLeft,
  progressFraction,
  ProgressUnit,
  type UserBookWithBook,
} from '@reading/shared';

import { useReadingSpeed } from '@/api/sessions';
import { useShelf } from '@/api/shelf';
import { formatDuration } from '@/lib/format';
import { toLibrarySections } from '@/library/shelves';
import ContinueReading, {
  type ContinueReadingProps,
} from '@/widgets/ContinueReading';
import { prepareWidgetCover } from '@/widgets/widgetCover';

// Keeps the iOS home screen widget in step with the "Reading now" book: a
// new snapshot whenever the book, its progress or the reading speed changes.
// Mounted in the tabs layout, where the user is signed in.
export function useHomeWidgetSync() {
  const { t } = useTranslation();
  const { data: shelf } = useShelf();
  const { data: speed } = useReadingSpeed();
  // iOS limits how often a widget may reload: skip identical snapshots
  const lastSnapshot = useRef('');

  useEffect(() => {
    if (Platform.OS !== 'ios' || !shelf) {
      return;
    }

    let isCurrent = true;
    const current = toLibrarySections(shelf).current;

    function progressLabel(entry: UserBookWithBook): string {
      if (entry.progressUnit === ProgressUnit.PAGES && entry.book.pageCount) {
        return t('library.progressPage', {
          current: entry.currentProgress,
          total: entry.book.pageCount,
        });
      }

      return t(`book.progressValue.${entry.progressUnit}`, {
        current: entry.currentProgress,
      });
    }

    async function update() {
      const timeLeft = current ? minutesLeft(current, speed) : null;
      const props: ContinueReadingProps = {
        userBookId: current?.id ?? null,
        title: current?.book.title ?? '',
        author: current?.book.authors.join(', ') ?? '',
        coverPath: current
          ? await prepareWidgetCover('home', current.id, current.book.coverUrl)
          : null,
        fraction: current ? progressFraction(current) : null,
        progressLabel: current ? progressLabel(current) : '',
        timeLeftLabel:
          timeLeft === null
            ? null
            : t('common.approx', { value: formatDuration(timeLeft, t) }),
        headerLabel: t('library.readingNow').toUpperCase(),
        emptyTitle: t('widget.emptyTitle'),
        emptyText: t('widget.emptyText'),
      };
      const snapshot = JSON.stringify(props);

      if (isCurrent && snapshot !== lastSnapshot.current) {
        lastSnapshot.current = snapshot;
        ContinueReading.updateSnapshot(props);
      }
    }

    void update();

    return () => {
      isCurrent = false;
    };
  }, [shelf, speed, t]);
}
