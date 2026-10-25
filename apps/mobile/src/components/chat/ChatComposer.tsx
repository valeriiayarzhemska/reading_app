import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Feather } from '@expo/vector-icons';

import { MESSAGE_MAX_LENGTH } from '@reading/shared';

import { cn } from '@/lib/cn';
import { COLORS } from '@/theme/colors';

export function ChatComposer({ onSend }: { onSend: (text: string) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const canSend = text.trim() !== '';

  function send() {
    onSend(text.trim());
    // Cleared at once: the message is already on screen (optimistic)
    setText('');
  }

  return (
    <View className="flex-row items-end gap-2 px-4 pb-2 pt-2">
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
  );
}
