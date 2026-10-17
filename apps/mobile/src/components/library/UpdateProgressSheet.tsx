import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  progressError,
  ProgressUnit,
  type UserBookWithBook,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useUpdateProgress } from '@/api/shelf';

interface UpdateProgressSheetProps {
  entry: UserBookWithBook;
  open: boolean;
  onClose: () => void;
}

export function UpdateProgressSheet({
  entry,
  open,
  onClose,
}: UpdateProgressSheetProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(entry.currentProgress));
  const [wasOpen, setWasOpen] = useState(open);
  const update = useUpdateProgress(entry.id);

  // Refill on every open: the progress may have changed since (a session)
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setValue(String(entry.currentProgress));
    }
  }

  const progress = Number(value);
  const isNumber = value.trim() !== '' && Number.isInteger(progress);
  const error = isNumber
    ? progressError(entry.progressUnit, progress, entry.book.pageCount)
    : null;

  function save() {
    update.mutate(progress, { onSuccess: onClose });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('book.updateProgressTitle')}
      subtitle={entry.book.title}
    >
      <View className="gap-1.5">
        <TextField
          inSheet
          label={t(`book.units.${entry.progressUnit}`)}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          error={
            error
              ? t(`book.progressErrors.${error}`, {
                  total: entry.book.pageCount,
                })
              : undefined
          }
        />

        {entry.progressUnit === ProgressUnit.PAGES && entry.book.pageCount ? (
          <Text variant="muted" className="text-right text-xs">
            {t('book.ofTotal', { total: entry.book.pageCount })}
          </Text>
        ) : null}
      </View>

      {update.error ? (
        <Text className="text-center text-danger">{update.error.message}</Text>
      ) : null}

      <Button
        title={t('book.save')}
        disabled={!isNumber || error !== null}
        loading={update.isPending}
        onPress={save}
      />
    </Sheet>
  );
}
