import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import {
  CHAT_REACTIONS,
  ReportTarget,
  type ChatReaction,
} from '@reading/shared';

import { useReport } from '@/components/reports/ReportProvider';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

import type { ChatItem } from '@/chat/useClubChat';
import { cn } from '@/lib/cn';
import { useColors } from '@/theme/ThemeProvider';

interface MessageActionsSheetProps {
  // The last long-pressed message, kept while the sheet slides away
  message: ChatItem | null;
  myId: string;
  open: boolean;
  onClose: () => void;
  onReact: (message: ChatItem, emoji: ChatReaction) => void;
  onReply: (message: ChatItem) => void;
  // Your own messages only
  onDelete: (message: ChatItem) => void;
}

// Long-press on a message: react, reply, and delete (yours) or report
export function MessageActionsSheet({
  message,
  myId,
  open,
  onClose,
  onReact,
  onReply,
  onDelete,
}: MessageActionsSheetProps) {
  const colors = useColors();
  const report = useReport();
  const { t } = useTranslation();
  const isOwn = message?.author.id === myId;

  return (
    <Sheet open={open} onClose={onClose}>
      {message ? (
        <>
          <View className="flex-row justify-between">
            {CHAT_REACTIONS.map((emoji) => {
              const isMine = message.reactions.some(
                (reaction) =>
                  reaction.emoji === emoji && reaction.userIds.includes(myId),
              );

              return (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    onReact(message, emoji);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isMine }}
                  className={cn(
                    'h-12 w-12 items-center justify-center rounded-full active:opacity-70',
                    isMine ? 'bg-accent/30' : 'bg-card',
                  )}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              onReply(message);
              onClose();
            }}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-2xl bg-card px-4 py-3.5 active:opacity-70"
          >
            <Feather name="corner-up-left" size={18} color={colors.fg} />

            <Text className="font-sans-semibold">{t('chat.reply')}</Text>
          </Pressable>

          {/* Yours: delete. Someone else's: report. */}
          <Pressable
            onPress={() => {
              onClose();

              if (isOwn) {
                Alert.alert(t('chat.deleteTitle'), t('chat.deleteMessage'), [
                  { text: t('book.cancel'), style: 'cancel' },
                  {
                    text: t('chat.delete'),
                    style: 'destructive',
                    onPress: () => onDelete(message),
                  },
                ]);
              } else {
                report(ReportTarget.MESSAGE, message.id);
              }
            }}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-2xl bg-card px-4 py-3.5 active:opacity-70"
          >
            <Feather
              name={isOwn ? 'trash-2' : 'flag'}
              size={18}
              color={colors.danger}
            />

            <Text className="font-sans-semibold text-danger">
              {t(isOwn ? 'chat.delete' : 'report.title')}
            </Text>
          </Pressable>
        </>
      ) : null}
    </Sheet>
  );
}
