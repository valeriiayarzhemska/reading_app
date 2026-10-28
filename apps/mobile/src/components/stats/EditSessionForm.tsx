import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import { ProgressUnit, type DaySession } from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useDeleteSession, useUpdateSession } from '@/api/sessions';
import { useColors } from '@/theme/ThemeProvider';
import { MAX_LOG_MINUTES } from '@/timer/manualLog';

interface EditSessionFormProps {
  session: DaySession;
  // "3 October", for "Entry for 3 October"
  dateLabel: string;
  onDone: () => void;
}

function parseCount(value: string): number | null {
  const number = Number(value);

  return value.trim() !== '' && Number.isInteger(number) ? number : null;
}

// Mounted with key={session.id}, so its fields start fresh for each session
export function EditSessionForm({
  session,
  dateLabel,
  onDone,
}: EditSessionFormProps) {
  const colors = useColors();

  const { t } = useTranslation();
  const update = useUpdateSession();
  const remove = useDeleteSession();
  const isAudio = session.unit === ProgressUnit.MINUTES;

  const [minutes, setMinutes] = useState(
    String(Math.round(session.durationSec / 60)),
  );
  const [amount, setAmount] = useState(
    String(session.progressTo - session.progressFrom),
  );

  const minutesValue = parseCount(minutes);
  const amountValue = isAudio ? 0 : parseCount(amount);
  const minutesError =
    minutesValue !== null &&
    (minutesValue < 1 || minutesValue > MAX_LOG_MINUTES)
      ? t('timer.log.minutesRange', { max: MAX_LOG_MINUTES })
      : null;
  const canSave =
    minutesValue !== null &&
    amountValue !== null &&
    amountValue >= 0 &&
    minutesError === null;

  function save() {
    if (minutesValue === null || amountValue === null) {
      return;
    }

    update.mutate(
      {
        id: session.id,
        durationSec: minutesValue * 60,
        // Audiobooks: the minutes listened are the progress, left as it was
        progressTo: isAudio
          ? session.progressTo
          : session.progressFrom + amountValue,
      },
      { onSuccess: onDone },
    );
  }

  function confirmDelete() {
    Alert.alert(t('stats.edit.deleteTitle'), t('stats.edit.deleteMessage'), [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('stats.edit.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(session.id, { onSuccess: onDone }),
      },
    ]);
  }

  const error = update.error ?? remove.error;

  return (
    <View className="gap-4">
      <Pressable
        onPress={onDone}
        accessibilityRole="button"
        className="flex-row items-center gap-1 self-start active:opacity-60"
      >
        <Feather name="chevron-left" size={18} color={colors.fgMuted} />

        <Text variant="muted">{t('stats.day.sessions')}</Text>
      </Pressable>

      <View className="gap-1">
        <Text className="font-serif text-lg" numberOfLines={2}>
          {session.book.title}
        </Text>

        <Text variant="muted" className="text-sm">
          {t('stats.edit.entryFor', { date: dateLabel })}
        </Text>
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
            label={t(`timer.log.amount.${session.unit}`)}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
          />
        )}
      </View>

      <Text variant="muted" className="text-xs">
        {t('stats.edit.note')}
      </Text>

      {error ? (
        <Text className="text-center text-sm text-danger">{error.message}</Text>
      ) : null}

      <Button
        title={t('stats.edit.save')}
        disabled={!canSave}
        loading={update.isPending}
        onPress={save}
      />

      <Button
        title={t('stats.edit.delete')}
        variant="secondary"
        loading={remove.isPending}
        onPress={confirmDelete}
      />
    </View>
  );
}
