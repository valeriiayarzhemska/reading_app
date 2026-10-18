import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GOAL_TARGET_MAX, type StatsSummary } from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useDeleteGoal, useSetGoal } from '@/api/stats';

export function GoalCard({ stats }: { stats: StatsSummary }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  // Months left including this one: in October that's Oct, Nov, Dec = 3.
  // Read once on mount, so render doesn't read the clock.
  const [monthsLeft] = useState(() => 12 - new Date().getMonth());
  const { year, goal } = stats;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">{t('stats.goal.title')}</Text>

        {goal ? null : (
          <Pressable
            onPress={() => setIsEditing(true)}
            accessibilityRole="button"
            className="active:opacity-60"
          >
            <Text variant="label" className="text-accent">
              {t('stats.goal.new')}
            </Text>
          </Pressable>
        )}
      </View>

      {goal ? (
        <Pressable
          onPress={() => setIsEditing(true)}
          accessibilityRole="button"
          className="active:opacity-80"
        >
          <Card className="gap-3">
            <Text variant="label">{goal.year}</Text>

            <Text className="font-serif text-2xl">
              {t('stats.goal.progress', {
                done: year.booksRead,
                count: goal.target,
              })}
            </Text>

            <ProgressBar value={Math.min(1, year.booksRead / goal.target)} />

            <Text variant="muted" className="text-sm">
              {year.booksRead >= goal.target
                ? t('stats.goal.reached')
                : t('stats.goal.monthsLeft', { count: monthsLeft })}
            </Text>
          </Card>
        </Pressable>
      ) : (
        <Card className="gap-3">
          <Text variant="muted">
            {t('stats.goal.empty', { year: year.year })}
          </Text>

          <Button
            title={t('stats.goal.set')}
            variant="secondary"
            onPress={() => setIsEditing(true)}
          />
        </Card>
      )}

      <GoalSheet
        year={year.year}
        target={goal?.target ?? null}
        open={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </View>
  );
}

interface GoalSheetProps {
  year: number;
  // null: no goal yet
  target: number | null;
  open: boolean;
  onClose: () => void;
}

function GoalSheet({ year, target, open, onClose }: GoalSheetProps) {
  const { t } = useTranslation();
  const setGoal = useSetGoal();
  const deleteGoal = useDeleteGoal();
  const [value, setValue] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Refill on every open with the current goal (or empty for a new one)
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setValue(target === null ? '' : String(target));
    }
  }

  const number = Number(value);
  const isValid =
    value.trim() !== '' &&
    Number.isInteger(number) &&
    number >= 1 &&
    number <= GOAL_TARGET_MAX;
  const error = setGoal.error ?? deleteGoal.error;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('stats.goal.sheetTitle', { year })}
    >
      <TextField
        inSheet
        label={t('stats.goal.booksLabel')}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
        autoFocus
      />

      {error ? (
        <Text className="text-center text-sm text-danger">{error.message}</Text>
      ) : null}

      <Button
        title={t('stats.goal.save')}
        disabled={!isValid}
        loading={setGoal.isPending}
        onPress={() =>
          setGoal.mutate({ year, target: number }, { onSuccess: onClose })
        }
      />

      {target !== null ? (
        <Button
          title={t('stats.goal.delete')}
          variant="secondary"
          loading={deleteGoal.isPending}
          onPress={() => deleteGoal.mutate(year, { onSuccess: onClose })}
        />
      ) : null}
    </Sheet>
  );
}
