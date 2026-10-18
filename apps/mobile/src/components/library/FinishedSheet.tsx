import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePrecision, type UserBookWithBook } from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Chips, type ChipOption } from '@/components/ui/Chips';
import { DateField } from '@/components/ui/DateField';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

import { useSaveFinish } from '@/api/shelf';
import { currentLanguage } from '@/i18n';
import { cn } from '@/lib/cn';
import {
  finishDateFor,
  recentYears,
  shortMonthNames,
} from '@/library/finishDate';

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1);

interface FinishedSheetProps {
  entry: UserBookWithBook;
  open: boolean;
  onClose: () => void;
  // "Actually not finished yet": the screen moves the book back
  onNotFinished: () => void;
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export function FinishedSheet({
  entry,
  open,
  onClose,
  onNotFinished,
}: FinishedSheetProps) {
  const { t } = useTranslation();
  const language = currentLanguage();
  const save = useSaveFinish(entry.id);
  // Read once on mount: render must not read the clock
  const [today] = useState(() => new Date());

  const [wasOpen, setWasOpen] = useState(open);
  const [precision, setPrecision] = useState<DatePrecision>(DatePrecision.DAY);
  const [date, setDate] = useState(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showStart, setShowStart] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [rating, setRating] = useState<number | null>(null);

  // Every opening starts from what's saved (or today, for a book just
  // marked as read), not from whatever was picked last time
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      const finished = entry.finishedAt ? new Date(entry.finishedAt) : today;

      setPrecision(entry.finishedPrecision);
      setDate(finished);
      setYear(finished.getFullYear());
      setMonth(finished.getMonth());
      setShowStart(false);
      setStartDate(entry.startedAt ? new Date(entry.startedAt) : finished);
      setRating(entry.rating);
      save.reset();
    }
  }

  // "Year only" for this year would be 1 July, maybe still ahead: cap at today
  const picked = finishDateFor({ precision, date, year, month });
  const finishDate = picked > today ? today : picked;
  const startError =
    showStart && startDate > finishDate ? t('book.finished.startAfter') : null;

  const precisionOptions: SegmentOption<DatePrecision>[] = [
    { value: DatePrecision.DAY, label: t('book.finished.precision.DAY') },
    { value: DatePrecision.MONTH, label: t('book.finished.precision.MONTH') },
    { value: DatePrecision.YEAR, label: t('book.finished.precision.YEAR') },
  ];
  const yearOptions: ChipOption<number>[] = recentYears(today).map((value) => ({
    value,
    label: String(value),
  }));
  // No future months in the current year
  const monthOptions: ChipOption<number>[] = shortMonthNames(language)
    .map((label, value) => ({ value, label }))
    .filter(
      ({ value }) => year < today.getFullYear() || value <= today.getMonth(),
    );

  function submit() {
    save.mutate(
      {
        finishedAt: finishDate.toISOString(),
        finishedPrecision: precision,
        startedAt: showStart
          ? finishDateFor({
              precision: DatePrecision.DAY,
              date: startDate,
              year,
              month,
            }).toISOString()
          : undefined,
        rating,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('book.finished.title')}
      subtitle={`«${entry.book.title}»`}
    >
      <SegmentedControl
        options={precisionOptions}
        value={precision}
        onChange={setPrecision}
      />

      {precision === DatePrecision.DAY ? (
        <DateField
          label={t('book.finished.when')}
          value={date}
          onChange={setDate}
          maximumDate={today}
        />
      ) : (
        <View className="gap-3">
          <View className="gap-2">
            <Text variant="label">{t('book.finished.year')}</Text>

            <Chips options={yearOptions} value={year} onChange={setYear} />
          </View>

          {precision === DatePrecision.MONTH ? (
            <View className="gap-2">
              <Text variant="label">{t('book.finished.month')}</Text>

              <Chips options={monthOptions} value={month} onChange={setMonth} />
            </View>
          ) : null}
        </View>
      )}

      {/* A past finish has no sessions behind it */}
      {sameDay(finishDate, today) ? null : (
        <Text variant="muted" className="text-xs">
          {t('book.finished.pastNote')}
        </Text>
      )}

      {showStart ? (
        <View className="gap-1.5">
          <DateField
            label={t('book.finished.started')}
            value={startDate}
            onChange={setStartDate}
            maximumDate={finishDate}
          />

          {startError ? (
            <Text className="text-sm text-danger">{startError}</Text>
          ) : null}
        </View>
      ) : (
        <Pressable
          onPress={() => setShowStart(true)}
          accessibilityRole="button"
          className="self-start active:opacity-60"
        >
          <Text className="font-sans-semibold text-accent-light">
            {t('book.finished.addStart')}
          </Text>
        </Pressable>
      )}

      <View className="items-center gap-3">
        <Text className="font-serif text-5xl text-fg">
          {rating ?? '—'}
          <Text className="font-serif text-xl text-fg-faint">/10</Text>
        </Text>

        <View accessibilityRole="radiogroup" className="flex-row gap-1.5">
          {RATINGS.map((value) => (
            <Pressable
              key={value}
              onPress={() => setRating(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: rating === value }}
              className={cn(
                'h-11 flex-1 items-center justify-center rounded-xl border active:opacity-70',
                rating !== null && value <= rating
                  ? 'border-accent/60 bg-accent/20'
                  : 'border-border bg-card',
                rating === value && 'border-accent-light bg-accent-light',
              )}
            >
              <Text
                className={cn(
                  'font-sans-semibold text-sm',
                  rating === value ? 'text-accent-fg' : 'text-fg',
                )}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {save.error ? (
        <Text className="text-center text-sm text-danger">
          {save.error.message}
        </Text>
      ) : null}

      <Button
        title={
          rating === null
            ? t('book.finished.save')
            : t('book.finished.saveRating')
        }
        disabled={startError !== null}
        loading={save.isPending}
        onPress={submit}
      />

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        className="items-center py-1 active:opacity-60"
      >
        <Text className="font-sans-semibold text-fg-muted">
          {t('book.finished.notNow')}
        </Text>
      </Pressable>

      <Pressable
        onPress={onNotFinished}
        accessibilityRole="button"
        className="items-center active:opacity-60"
      >
        <Text variant="muted" className="text-sm text-fg-faint">
          {t('book.finished.notFinished')}
        </Text>
      </Pressable>
    </Sheet>
  );
}
