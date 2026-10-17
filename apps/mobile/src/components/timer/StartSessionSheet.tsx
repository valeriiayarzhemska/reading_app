import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import {
  BookFormat,
  convertProgress,
  progressError,
  ProgressUnit,
  type UserBookWithBook,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useActiveSession } from '@/timer/useActiveSession';

type ReadingUnit = typeof ProgressUnit.PAGES | typeof ProgressUnit.PERCENT;

interface StartSessionSheetProps {
  entry: UserBookWithBook;
  open: boolean;
  onClose: () => void;
}

export function StartSessionSheet({
  entry,
  open,
  onClose,
}: StartSessionSheetProps) {
  const { t } = useTranslation();
  const { start } = useActiveSession();
  const { pageCount } = entry.book;
  const isAudio = entry.format === BookFormat.AUDIO;

  const initialUnit = isAudio ? ProgressUnit.MINUTES : entry.progressUnit;
  const [unit, setUnit] = useState<ProgressUnit>(initialUnit);
  const [value, setValue] = useState(String(entry.currentProgress));
  const [wasOpen, setWasOpen] = useState(open);

  // The sheet stays mounted while closed, so useState's initial values go
  // stale (a session moves the progress). Refill them each time it opens.
  // Done during render, not in an effect, so there's no flash of old values.
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setUnit(initialUnit);
      setValue(String(entry.currentProgress));
    }
  }

  const progress = Number(value);
  const isNumber = value.trim() !== '' && Number.isInteger(progress);
  const error = isNumber ? progressError(unit, progress, pageCount) : null;
  const approxPages =
    unit === ProgressUnit.PERCENT && isNumber
      ? convertProgress(
          progress,
          ProgressUnit.PERCENT,
          ProgressUnit.PAGES,
          pageCount,
        )
      : null;

  const unitOptions: SegmentOption<ReadingUnit>[] = [
    { value: ProgressUnit.PAGES, label: t('timer.units.PAGES') },
    { value: ProgressUnit.PERCENT, label: t('timer.units.PERCENT') },
  ];

  // Switching unit converts the current value, so "page 92" becomes "11%"
  function changeUnit(next: ReadingUnit) {
    const converted = isNumber
      ? convertProgress(progress, unit, next, pageCount)
      : null;

    setUnit(next);
    setValue(converted === null ? '0' : String(converted));
  }

  function startSession() {
    start({ entry, unit, progressFrom: progress });
    onClose();
    router.push('/timer');
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('timer.startTitle')}
      subtitle={entry.book.title}
    >
      {/* Without a page count, pages can't be converted to percent */}
      {!isAudio && pageCount ? (
        <SegmentedControl
          options={unitOptions}
          value={unit as ReadingUnit}
          onChange={changeUnit}
        />
      ) : null}

      <View className="gap-1.5">
        <TextField
          inSheet
          label={t(`timer.startFrom.${unit}`)}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          error={
            error
              ? t(`book.progressErrors.${error}`, { total: pageCount })
              : undefined
          }
        />

        {approxPages !== null ? (
          <Text variant="muted" className="text-right text-xs">
            {t('timer.approxPages', { count: approxPages })}
          </Text>
        ) : null}
      </View>

      <Button
        title={t('timer.start')}
        disabled={!isNumber || error !== null}
        onPress={startSession}
      />
    </Sheet>
  );
}
