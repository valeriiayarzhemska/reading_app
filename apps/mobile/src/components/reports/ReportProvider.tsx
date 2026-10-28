import { createContext, useContext, useState, type ReactNode } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import { useMutation } from '@tanstack/react-query';

import {
  REPORT_NOTE_MAX,
  ReportReason,
  ReportTarget,
  type ReportInput,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { apiFetch } from '@/api/client';
import { cn } from '@/lib/cn';
import { useColors } from '@/theme/ThemeProvider';

type Report = (targetType: ReportTarget, targetId: string) => void;

const ReportContext = createContext<Report | null>(null);

interface Target {
  type: ReportTarget;
  id: string;
}

// "Wrong information" only makes sense for a book's details
function reasonsFor(type: ReportTarget): ReportReason[] {
  const reasons: ReportReason[] = [ReportReason.SPAM, ReportReason.OFFENSIVE];

  if (type === ReportTarget.BOOK) {
    reasons.push(ReportReason.WRONG_INFO);
  }

  reasons.push(ReportReason.OTHER);

  return reasons;
}

// One sheet for the whole app: rows in long lists (posts, comments,
// messages) call report() instead of each carrying a hidden sheet
export function ReportProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const colors = useColors();
  // Kept after closing, so the sheet doesn't empty while it slides away
  const [target, setTarget] = useState<Target | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(ReportReason.SPAM);
  const [note, setNote] = useState('');
  const send = useMutation({
    mutationFn: (input: ReportInput) =>
      apiFetch<void>('/reports', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });

  function report(type: ReportTarget, id: string) {
    setTarget({ type, id });
    setReason(ReportReason.SPAM);
    setNote('');
    send.reset();
    setIsOpen(true);
  }

  function submit() {
    if (!target) {
      return;
    }

    send.mutate(
      {
        targetType: target.type,
        targetId: target.id,
        reason,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          Alert.alert(t('report.thanksTitle'), t('report.thanksMessage'));
        },
      },
    );
  }

  return (
    <ReportContext.Provider value={report}>
      {children}

      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('report.title')}
        subtitle={target ? t(`report.targets.${target.type}`) : undefined}
      >
        {target ? (
          <View accessibilityRole="radiogroup" className="gap-2">
            {reasonsFor(target.type).map((option) => {
              const isSelected = option === reason;

              return (
                <Pressable
                  key={option}
                  onPress={() => setReason(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    'flex-row items-center justify-between rounded-2xl border px-4 py-3.5 active:opacity-70',
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-card',
                  )}
                >
                  <Text>{t(`report.reasons.${option}`)}</Text>

                  {isSelected ? (
                    <Feather name="check" size={18} color={colors.accent} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <TextField
          inSheet
          value={note}
          onChangeText={setNote}
          placeholder={t('report.notePlaceholder')}
          maxLength={REPORT_NOTE_MAX}
          multiline
        />

        {send.error ? (
          <Text className="text-center text-danger">{send.error.message}</Text>
        ) : null}

        <Button
          title={t('report.send')}
          loading={send.isPending}
          onPress={submit}
        />
      </Sheet>
    </ReportContext.Provider>
  );
}

// report('POST', post.id) opens the sheet for that item
export function useReport(): Report {
  const report = useContext(ReportContext);

  if (!report) {
    throw new Error('useReport must be used inside ReportProvider');
  }

  return report;
}
