import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import type { ChatReaction, ReplyPreview } from '@reading/shared';

import { Avatar } from '@/components/ui/Avatar';
import { RemoteImage } from '@/components/ui/RemoteImage';
import { Text } from '@/components/ui/Text';

import type { ChatItem } from '@/chat/useClubChat';
import { currentLanguage } from '@/i18n';
import { cn } from '@/lib/cn';
import { useColors } from '@/theme/ThemeProvider';

// Photos have no stored size yet: one shape keeps the list stable
const PHOTO_WIDTH = 240;
const PHOTO_HEIGHT = 300;

function messageTime(iso: string): string {
  return new Intl.DateTimeFormat(currentLanguage(), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

interface MessageBubbleProps {
  message: ChatItem;
  myId: string;
  // First of a run by the same author: name and avatar shown
  isFirstInRun: boolean;
  onRetry: (message: ChatItem) => void;
  onLongPress: (message: ChatItem) => void;
  onReact: (message: ChatItem, emoji: ChatReaction) => void;
}

export function MessageBubble({
  message,
  myId,
  isFirstInRun,
  onRetry,
  onLongPress,
  onReact,
}: MessageBubbleProps) {
  const colors = useColors();

  const { t } = useTranslation();
  const isMine = message.author.id === myId;
  const isFailed = message.status === 'failed';
  // While sending, the photo is still a file on this phone
  const photo = message.photoUrl ?? message.localPhotoUri;

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

      <View
        className={cn(
          'max-w-[78%] gap-1',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        <Pressable
          onPress={isFailed ? () => onRetry(message) : undefined}
          // Reply and react: only to messages the server has confirmed
          onLongPress={message.status ? undefined : () => onLongPress(message)}
          delayLongPress={250}
          className={cn(
            'gap-1 overflow-hidden rounded-2xl',
            isMine ? 'bg-accent' : 'bg-card-strong',
            message.status === 'sending' && 'opacity-70',
          )}
        >
          {!isMine && isFirstInRun ? (
            <Text className="px-3.5 pt-2 font-sans-semibold text-sm text-accent">
              {message.author.nickname}
            </Text>
          ) : null}

          {message.replyTo ? (
            <Quote reply={message.replyTo} isMine={isMine} />
          ) : null}

          {photo ? (
            <RemoteImage
              uri={photo}
              style={{ width: PHOTO_WIDTH, height: PHOTO_HEIGHT }}
              accessibilityLabel={t('chat.photo')}
            />
          ) : null}

          {message.text ? (
            <Text className={cn('px-3.5', isMine && 'text-accent-fg')}>
              {message.text}
            </Text>
          ) : null}

          <View className="flex-row items-center justify-end gap-1 px-3.5 pb-2">
            {message.status === 'sending' ? (
              <Feather name="clock" size={11} color={colors.accentFg} />
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

        {message.reactions.length > 0 ? (
          <View className="flex-row flex-wrap gap-1">
            {message.reactions.map(({ emoji, userIds }) => {
              const isMineReaction = userIds.includes(myId);

              return (
                <Pressable
                  key={emoji}
                  onPress={() => onReact(message, emoji as ChatReaction)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isMineReaction }}
                  className={cn(
                    'flex-row items-center gap-1 rounded-full border px-2 py-0.5 active:opacity-70',
                    isMineReaction
                      ? 'border-accent bg-accent/20'
                      : 'border-border bg-card',
                  )}
                >
                  <Text className="text-sm">{emoji}</Text>

                  <Text className="text-xs">{userIds.length}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// The answered message, inside the reply's bubble
function Quote({ reply, isMine }: { reply: ReplyPreview; isMine: boolean }) {
  const { t } = useTranslation();

  return (
    <View
      className={cn(
        'mx-2 mt-2 rounded-lg border-l-2 px-2 py-1',
        isMine ? 'border-accent-fg/50 bg-black/10' : 'border-accent bg-white/5',
      )}
    >
      <Text
        className={cn(
          'font-sans-semibold text-xs',
          isMine ? 'text-accent-fg' : 'text-accent',
        )}
      >
        {reply.authorNickname}
      </Text>

      <Text
        className={cn(
          'text-xs',
          isMine ? 'text-accent-fg/80' : 'text-fg-muted',
        )}
        numberOfLines={1}
      >
        {reply.text || (reply.hasPhoto ? t('chat.photoQuote') : '')}
      </Text>
    </View>
  );
}
