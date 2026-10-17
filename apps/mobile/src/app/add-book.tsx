import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { router, useLocalSearchParams } from 'expo-router';

import { zodResolver } from '@hookform/resolvers/zod';

import {
  BOOK_PAGE_COUNT_MAX,
  normalizeIsbn,
  ShelfStatus,
} from '@reading/shared';

import { FormTextField } from '@/components/form/FormTextField';
import { CoverPicker } from '@/components/library/CoverPicker';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';

import { useAddManualBook } from '@/api/shelf';
import {
  manualBookSchema,
  type ManualBookError,
  type ManualBookValues,
} from '@/library/manualBookForm';

type ManualStatus = ManualBookValues['status'];

export default function AddBookScreen() {
  const { t } = useTranslation();
  // What the user searched for is probably the title, unless it was an ISBN
  const { query = '' } = useLocalSearchParams<{ query?: string }>();
  const addBook = useAddManualBook();

  // onTouched: no red errors while typing the first time, only after leaving
  // a field (or pressing Add); from then on they update live
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(manualBookSchema),
    mode: 'onTouched',
    defaultValues: {
      title: normalizeIsbn(query) ? '' : query,
      author: '',
      pageCount: '',
      status: ShelfStatus.WANT_TO_READ,
    },
  });
  const status = useController({ control, name: 'status' });
  const cover = useController({ control, name: 'coverUri' });

  const statusOptions: SegmentOption<ManualStatus>[] = [
    {
      value: ShelfStatus.WANT_TO_READ,
      label: t('library.sections.WANT_TO_READ'),
    },
    { value: ShelfStatus.READING, label: t('library.sections.READING') },
    { value: ShelfStatus.READ, label: t('library.sections.READ') },
  ];

  function translateError(code: string) {
    return t(`addBook.errors.${code as ManualBookError}`, {
      max: BOOK_PAGE_COUNT_MAX,
    });
  }

  // handleSubmit runs the schema first and calls this only with parsed
  // values (pageCount is already a number here)
  const submit = handleSubmit((values) => {
    addBook.mutate(
      {
        title: values.title,
        authors: values.author ? [values.author] : [],
        pageCount: values.pageCount,
        coverUri: values.coverUri,
        status: values.status,
      },
      {
        // replace, not push: Back from the new book goes to search, not to
        // a filled-in form for a book that already exists
        onSuccess: (entry) =>
          router.replace({ pathname: '/book/[id]', params: { id: entry.id } }),
      },
    );
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerClassName="gap-5 px-4 pb-10 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="muted">{t('addBook.hint')}</Text>

          <CoverPicker
            uri={cover.field.value}
            onChange={cover.field.onChange}
          />

          <FormTextField
            control={control}
            name="title"
            translateError={translateError}
            label={t('addBook.titleLabel')}
            autoFocus={!query}
          />

          <FormTextField
            control={control}
            name="author"
            translateError={translateError}
            label={t('addBook.authorLabel')}
            autoCapitalize="words"
          />

          <FormTextField
            control={control}
            name="pageCount"
            translateError={translateError}
            label={t('addBook.pagesLabel')}
            keyboardType="number-pad"
          />

          <View className="gap-1.5">
            <Text variant="label">{t('addBook.shelfLabel')}</Text>

            <SegmentedControl
              options={statusOptions}
              value={status.field.value}
              onChange={status.field.onChange}
            />
          </View>

          {addBook.error ? (
            <Text className="text-center text-danger">
              {addBook.error.message}
            </Text>
          ) : null}

          <Button
            title={t('addBook.submit')}
            loading={addBook.isPending}
            onPress={submit}
            className="mt-2"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
