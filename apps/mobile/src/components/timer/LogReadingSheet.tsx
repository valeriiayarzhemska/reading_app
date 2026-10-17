import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';

import {
  progressError,
  ProgressUnit,
  type UserBookWithBook,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useSaveSession } from '@/api/sessions';
import { currentLanguage } from '@/i18n';
import { formatDate } from '@/lib/format';
import { COLORS } from '@/theme/colors';
import {
  buildLoggedSession,
  MAX_DAYS_AGO,
  MAX_LOG_MINUTES,
} from '@/timer/manualLog';

interface LogReadingSheetProps {
  entry: UserBookWithBook;
  open: boolean;
  onClose: () => void;
}

function parseCount(value: string): number | null {
  const number = Number(value);

  return value.trim() !== '' && Number.isInteger(number) ? number : null;
}

export function LogReadingSheet({
  entry,
  open,
  onClose,
}: LogReadingSheetProps) {
  const { t } = useTranslation();
  const save = useSaveSession();
  const [wasOpen, setWasOpen] = useState(open);
  const [clientId, setClientId] = useState('');
  const [daysAgo, setDaysAgo] = useState(0);
  // The chosen day as a date, for the label. Set in the arrow handlers:
  // reading the clock during render would make it impure.
  const [day, setDay] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const [amount, setAmount] = useState('');
  const isAudio = entry.progressUnit === ProgressUnit.MINUTES;

  // Fresh fields and a fresh clientId on every open. The id is made here, not
  // on Save: pressing Save twice (or again after an error) is the same
  // session, and the server saves it once.
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setClientId(randomUUID());
      setDaysAgo(0);
      setDay(null);
      setMinutes('');
      setAmount('');
      save.reset();
    }
  }

  const minutesValue = parseCount(minutes);
  const amountValue = isAudio ? 0 : parseCount(amount);
  const minutesError =
    minutesValue !== null &&
    (minutesValue < 1 || minutesValue > MAX_LOG_MINUTES)
      ? t('timer.log.minutesRange', { max: MAX_LOG_MINUTES })
      : null;
  const read = isAudio ? minutesValue : amountValue;
  const progressTo = read === null ? null : entry.currentProgress + read;
  const overTotal =
    progressTo === null
      ? null
      : progressError(entry.progressUnit, progressTo, entry.book.pageCount);
  const amountError =
    !isAudio && amountValue !== null && amountValue < 1
      ? t('timer.log.amountMin')
      : overTotal
        ? t(`book.progressErrors.${overTotal}`, { total: entry.book.pageCount })
        : null;

  const canSave =
    minutesValue !== null &&
    read !== null &&
    minutesError === null &&
    amountError === null;

  const dayLabel =
    daysAgo === 0 || !day
      ? t('timer.log.today')
      : daysAgo === 1
        ? t('timer.log.yesterday')
        : formatDate(day, currentLanguage());

  function changeDay(step: number) {
    const next = Math.min(MAX_DAYS_AGO, Math.max(0, daysAgo + step));
    const date = new Date();

    date.setDate(date.getDate() - next);
    setDaysAgo(next);
    setDay(date.toISOString());
  }

  function submit() {
    if (minutesValue === null || read === null) {
      return;
    }

    save.mutate(
      buildLoggedSession(
        { clientId, entry, daysAgo, minutes: minutesValue, amount: read },
        new Date(),
      ),
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('timer.log.title')}
      subtitle={entry.book.title}
    >
      <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-2 py-1">
        <Pressable
          onPress={() => changeDay(1)}
          disabled={daysAgo === MAX_DAYS_AGO}
          accessibilityRole="button"
          accessibilityLabel={t('timer.log.earlier')}
          className="h-11 w-11 items-center justify-center active:opacity-60 disabled:opacity-30"
        >
          <Feather name="chevron-left" size={22} color={COLORS.fg} />
        </Pressable>

        <Text className="font-sans-semibold">{dayLabel}</Text>

        <Pressable
          onPress={() => changeDay(-1)}
          disabled={daysAgo === 0}
          accessibilityRole="button"
          accessibilityLabel={t('timer.log.later')}
          className="h-11 w-11 items-center justify-center active:opacity-60 disabled:opacity-30"
        >
          <Feather name="chevron-right" size={22} color={COLORS.fg} />
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        <TextField
          inSheet
          className="flex-1"
          label={t('timer.log.minutes')}
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
          error={minutesError ?? undefined}
        />

        {isAudio ? null : (
          <TextField
            inSheet
            className="flex-1"
            label={t(`timer.log.amount.${entry.progressUnit}`)}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            error={amountError ?? undefined}
          />
        )}
      </View>

      {save.error ? (
        <Text className="text-center text-sm text-danger">
          {t('timer.saveFailed', { message: save.error.message })}
        </Text>
      ) : null}

      <Button
        title={t('timer.log.save')}
        disabled={!canSave}
        loading={save.isPending}
        onPress={submit}
      />
    </Sheet>
  );
}
