import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';

import type { ChatItem } from '@/chat/useClubChat';
import { currentLanguage } from '@/i18n';
import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

function messageTime(iso: string): string {
  return new Intl.DateTimeFormat(currentLanguage(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface MessageBubbleProps {
  message: ChatItem;
  isMine: boolean;
  // First of a run by the same author: name and avatar shown
  isFirstInRun: boolean;
  onRetry: (message: ChatItem) => void;
}

export function MessageBubble({
  message,
  isMine,
  isFirstInRun,
  onRetry,
}: MessageBubbleProps) {
  const { t } = useTranslation();
  const isFailed = message.status === 'failed';

  return (
    <View
      className={cn(
        'flex-row items-end gap-2 px-4',
        isMine ? 'justify-end' : 'justify-start',
        isFirstInRun ? 'mt-3' : 'mt-1',
      )}
    >
      {isMine ? null : (
        // An empty slot of the same width keeps a run's bubbles aligned
        <View style={{ width: 32 }}>
          {isFirstInRun ? (
            <Avatar
              name={message.author.displayName}
              url={message.author.avatarUrl}
              size={32}
            />
          ) : null}
        </View>
      )}

      <Pressable
        onPress={isFailed ? () => onRetry(message) : undefined}
        disabled={!isFailed}
        className={cn(
          'max-w-[78%] gap-0.5 rounded-2xl px-3.5 py-2',
          isMine ? 'bg-accent' : 'bg-card-strong',
          message.status === 'sending' && 'opacity-70',
        )}
      >
        {!isMine && isFirstInRun ? (
          <Text className="font-sans-semibold text-sm text-accent">
            {message.author.nickname}
          </Text>
        ) : null}

        <Text className={isMine ? 'text-accent-fg' : undefined}>
          {message.text}
        </Text>

        <View className="flex-row items-center justify-end gap-1">
          {message.status === 'sending' ? (
            <Feather name="clock" size={11} color={COLORS.accentFg} />
          ) : null}

          {/* Only your own messages can fail, and they sit on the orange
              bubble: dark text reads there, red wouldn't */}
          {isFailed ? (
            <Text className="font-sans-semibold text-xs text-accent-fg">
              {t('chat.failed')}
            </Text>
          ) : (
            <Text
              className={cn(
                'text-[11px]',
                isMine ? 'text-accent-fg/70' : 'text-fg-faint',
              )}
            >
              {messageTime(message.createdAt)}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
