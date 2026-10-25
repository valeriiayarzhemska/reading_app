import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import { MESSAGE_MAX_LENGTH } from '@reading/shared';

import { RemoteImage } from '@/components/ui/RemoteImage';
import { Text } from '@/components/ui/Text';

import { pickChatPhoto } from '@/chat/chatPhoto';
import type { ChatDraft, ChatItem } from '@/chat/useClubChat';
import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

interface ChatComposerProps {
  // The message being answered, chosen from its long-press sheet
  replyTo: ChatItem | null;
  onCancelReply: () => void;
  onSend: (draft: ChatDraft) => void;
}

export function ChatComposer({
  replyTo,
  onCancelReply,
  onSend,
}: ChatComposerProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // A photo alone is a message too
  const canSend = text.trim() !== '' || photoUri !== null;

  async function attach() {
    const uri = await pickChatPhoto();

    if (uri) {
      setPhotoUri(uri);
    }
  }

  function send() {
    onSend({
      text: text.trim(),
      localPhotoUri: photoUri ?? undefined,
      replyTo: replyTo ?? undefined,
    });
    // Cleared at once: the message is already on screen (optimistic)
    setText('');
    setPhotoUri(null);
    onCancelReply();
  }

  return (
    <View className="gap-2 px-4 pb-2 pt-2">
      {replyTo ? (
        <View className="flex-row items-center gap-3 rounded-2xl border-l-2 border-accent bg-card px-3 py-2">
          <Feather name="corner-up-left" size={16} color={COLORS.accent} />

          <View className="flex-1">
            <Text className="font-sans-semibold text-xs text-accent">
              {t('chat.replyingTo', { nickname: replyTo.author.nickname })}
            </Text>

            <Text variant="muted" className="text-xs" numberOfLines={1}>
              {replyTo.text || t('chat.photoQuote')}
            </Text>
          </View>

          <Pressable
            onPress={onCancelReply}
            accessibilityLabel={t('chat.cancelReply')}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Feather name="x" size={18} color={COLORS.fgFaint} />
          </Pressable>
        </View>
      ) : null}

      {photoUri ? (
        <View className="self-start">
          <RemoteImage
            uri={photoUri}
            style={{ width: 72, height: 90, borderRadius: 12 }}
          />

          <Pressable
            onPress={() => setPhotoUri(null)}
            accessibilityLabel={t('chat.removePhoto')}
            className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-card-strong active:opacity-70"
          >
            <Feather name="x" size={14} color={COLORS.fg} />
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <Pressable
          onPress={attach}
          accessibilityRole="button"
          accessibilityLabel={t('chat.attachPhoto')}
          className="h-12 w-9 items-center justify-center active:opacity-60"
        >
          <Feather name="paperclip" size={22} color={COLORS.fgMuted} />
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={COLORS.fgFaint}
          selectionColor={COLORS.accent}
          keyboardAppearance="dark"
          multiline
          maxLength={MESSAGE_MAX_LENGTH}
          className="max-h-32 flex-1 rounded-3xl border border-border bg-card px-4 py-3 font-sans text-base text-fg"
        />

        <Pressable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          className={cn(
            'h-12 w-12 items-center justify-center rounded-full active:opacity-70',
            canSend ? 'bg-accent' : 'bg-card',
          )}
        >
          <Feather
            name="arrow-up"
            size={22}
            color={canSend ? COLORS.accentFg : COLORS.fgFaint}
          />
        </Pressable>
      </View>
    </View>
  );
}
