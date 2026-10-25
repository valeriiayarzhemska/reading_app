import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Stack, useLocalSearchParams } from 'expo-router';

import {
  CollectionDraftProvider,
  NEW_COLLECTION,
} from '@/components/collections/CollectionDraftProvider';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

import { useCollection } from '@/api/collections';
import { STACK_OPTIONS } from '@/navigation/stackOptions';
import { COLORS } from '@/theme/colors';

// /collection-editor/new creates, /collection-editor/<id> edits. The id is
// a path segment, so it belongs to this layout and stays in the URL when
// the picker (/collection-editor/<id>/books) opens.
export default function CollectionEditorLayout() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id === NEW_COLLECTION ? undefined : params.id;
  const { data, error } = useCollection(id);

  if (id && !data) {
    return (
      <Screen className="items-center justify-center px-6">
        {error ? (
          <Text className="text-center">{error.message}</Text>
        ) : (
          <ActivityIndicator color={COLORS.fg} />
        )}
      </Screen>
    );
  }

  return (
    <CollectionDraftProvider initial={data}>
      <Stack screenOptions={STACK_OPTIONS}>
        <Stack.Screen
          name="index"
          options={{
            title: t(id ? 'collections.editTitle' : 'collections.newTitle'),
          }}
        />

        <Stack.Screen
          name="books"
          options={{ title: t('collections.addBooks') }}
        />
      </Stack>
    </CollectionDraftProvider>
  );
}
