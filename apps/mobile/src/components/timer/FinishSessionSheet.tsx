import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  convertProgress,
  ProgressUnit,
  sessionProgressError,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useSaveSession, type SaveOutcome } from '@/api/sessions';
import {
  elapsedMs,
  formatElapsed,
  toNewSession,
  type ActiveSession,
} from '@/timer/activeSession';

interface FinishSessionSheetProps {
  session: ActiveSession;
  open: boolean;
  onClose: () => void;
  onSaved: (outcome: SaveOutcome) => void;
  // From the screen's useNow: rendering must not read the clock itself
  now: number;
}

export function FinishSessionSheet({
  session,
  open,
  onClose,
  onSaved,
  now,
}: FinishSessionSheetProps) {
  const { t } = useTranslation();
  const save = useSaveSession();
  const [value, setValue] = useState(String(session.progressFrom));
  const { pageCount } = session.book;

  const progressTo = Number(value);
  const isNumber = value.trim() !== '' && Number.isInteger(progressTo);
  const error = isNumber
    ? sessionProgressError(
        session.unit,
        session.progressFrom,
        progressTo,
        pageCount,
      )
    : null;
  const approxPages =
    session.unit === ProgressUnit.PERCENT && isNumber
      ? convertProgress(
          progressTo,
          ProgressUnit.PERCENT,
          ProgressUnit.PAGES,
          pageCount,
        )
      : null;

  function submit() {
    save.mutate(toNewSession(session, progressTo, Date.now()), {
      onSuccess: onSaved,
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t(`timer.stopAt.${session.unit}`)}
      subtitle={t('timer.readFor', {
        time: formatElapsed(elapsedMs(session, now)),
      })}
    >
      <View className="gap-1.5">
        <TextField
          inSheet
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          selectTextOnFocus
          error={
            error
              ? t(`timer.finishErrors.${error}`, {
                  from: session.progressFrom,
                  total: pageCount,
                })
              : undefined
          }
        />

        {approxPages !== null ? (
          <Text variant="muted" className="text-right text-xs">
            {t('timer.approxPages', { count: approxPages })}
          </Text>
        ) : null}
      </View>

      {/* Only a rejection (4xx) ends up here: network failures are queued */}
      {save.error ? (
        <Text className="text-center text-sm text-danger">
          {t('timer.saveFailed', { message: save.error.message })}
        </Text>
      ) : null}

      <Button
        title={t('timer.save')}
        disabled={!isNumber || error !== null}
        loading={save.isPending}
        onPress={submit}
      />
    </Sheet>
  );
}
