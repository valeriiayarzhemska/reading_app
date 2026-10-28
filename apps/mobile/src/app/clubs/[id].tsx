import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { router, useLocalSearchParams } from 'expo-router';

import { FlashList } from '@shopify/flash-list';

import type { ClubDetail } from '@reading/shared';

import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageActionsSheet } from '@/components/chat/MessageActionsSheet';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ClubAvatar } from '@/components/clubs/ClubAvatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useClub, useJoinClub } from '@/api/clubs';
import { useAuth } from '@/auth/AuthContext';
import { useClubChat, type ChatItem } from '@/chat/useClubChat';
import { shareClub } from '@/clubs/shareClub';
import { useColors } from '@/theme/ThemeProvider';

// A new run (name + avatar again) after another author or a 5 min pause
const RUN_GAP_MS = 5 * 60 * 1000;

function startsRun(message: ChatItem, previous: ChatItem | undefined) {
  return (
    !previous ||
    previous.author.id !== message.author.id ||
    new Date(message.createdAt).getTime() -
      new Date(previous.createdAt).getTime() >
      RUN_GAP_MS
  );
}

// The club's chat: readingapp://clubs/<id>
export default function ClubChatScreen() {
  const colors = useColors();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useClub(id);

  return (
    // Own header (as in the design), so the screen covers the top inset too
    <Screen edges={['top', 'bottom']}>
      {data ? (
        <>
          <ChatHeader club={data} />

          {data.isMember ? (
            <Chat clubId={data.id} />
          ) : (
            <JoinPrompt club={data} />
          )}
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          {error ? (
            <Text className="text-center">{error.message}</Text>
          ) : (
            <ActivityIndicator color={colors.fg} />
          )}
        </View>
      )}
    </Screen>
  );
}

function ChatHeader({ club }: { club: ClubDetail }) {
  const { t } = useTranslation();

  function openInfo() {
    router.push({ pathname: '/club-info/[id]', params: { id: club.id } });
  }

  return (
    <View className="flex-row items-center gap-2 px-4 pb-2">
      <IconButton
        icon="chevron-left"
        label={t('chat.back')}
        onPress={() => router.back()}
      />

      {/* Tapping the name opens About the room, as in most chat apps */}
      <Pressable onPress={openInfo} className="flex-1 px-1 active:opacity-70">
        <Text variant="heading" numberOfLines={1}>
          {club.name}
        </Text>

        <Text variant="muted" className="text-xs" numberOfLines={1}>
          {t('chat.openChat')} ·{' '}
          {t('clubs.members', { count: club.membersCount })}
        </Text>
      </Pressable>

      <IconButton
        icon="share"
        label={t('clubs.info.share')}
        onPress={() => shareClub(club, t)}
      />

      <IconButton
        icon="info"
        label={t('clubs.info.title')}
        onPress={openInfo}
      />
    </View>
  );
}

function Chat({ clubId }: { clubId: string }) {
  const colors = useColors();

  const { t } = useTranslation();
  const { state } = useAuth();
  const myId = state.status === 'signedIn' ? state.user.id : '';
  const { history, messages, send, retry, react, deleteMessage } =
    useClubChat(clubId);
  const [replyTo, setReplyTo] = useState<ChatItem | null>(null);
  // The long-pressed message; kept after closing so the sheet doesn't empty
  // while it slides away
  const [selected, setSelected] = useState<ChatItem | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      // Android resizes the window for the keyboard by itself
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {history.isPending ? (
        <ActivityIndicator className="flex-1" color={colors.fg} />
      ) : (
        <FlashList
          data={messages}
          // clientId, not id: the optimistic bubble gets the server's id when
          // confirmed, and a changed key would remount (flicker) the row
          keyExtractor={(message) => message.clientId}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              myId={myId}
              isFirstInRun={startsRun(item, messages[index - 1])}
              onRetry={retry}
              onReact={react}
              onLongPress={(message) => {
                setSelected(message);
                setIsActionsOpen(true);
              }}
            />
          )}
          // Opens at the newest message; follows new ones only when you're
          // already near the bottom, so reading older ones isn't interrupted
          maintainVisibleContentPosition={{
            startRenderingFromBottom: true,
            autoscrollToBottomThreshold: 0.2,
          }}
          // Scrolled up to the oldest loaded message: fetch the page before
          onStartReached={() => {
            if (history.hasNextPage && !history.isFetchingNextPage) {
              void history.fetchNextPage();
            }
          }}
          onStartReachedThreshold={0.5}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListHeaderComponent={
            history.isFetchingNextPage ? (
              <ActivityIndicator className="py-3" color={colors.fg} />
            ) : null
          }
          ListEmptyComponent={
            <Text variant="muted" className="mt-8 px-6 text-center">
              {t('chat.empty')}
            </Text>
          }
        />
      )}

      <ChatComposer
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={send}
      />

      <MessageActionsSheet
        message={selected}
        myId={myId}
        open={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onReact={react}
        onReply={setReplyTo}
        onDelete={deleteMessage}
      />
    </KeyboardAvoidingView>
  );
}

// Opened by link without being a member: the chat is for members only
function JoinPrompt({ club }: { club: ClubDetail }) {
  const { t } = useTranslation();
  const join = useJoinClub(club.id);

  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <ClubAvatar name={club.name} color={club.color} size={72} />

      <Text variant="muted" className="text-center">
        {t('chat.joinToRead')}
      </Text>

      <Button
        title={t('clubs.join')}
        loading={join.isPending}
        onPress={() => join.mutate()}
      />
    </View>
  );
}
