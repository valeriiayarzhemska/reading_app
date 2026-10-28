import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  NOTE_MAX_LENGTH,
  QUOTE_PAGE_MAX,
  type BookNote,
} from '@reading/shared';

import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

import { useSaveNote } from '@/api/notes';

interface NoteSheetProps {
  entryId: string;
  bookTitle: string;
  // Editing this note; null writes a new one
  note: BookNote | null;
  // Pre-filled page for a new note (the timer passes where you are)
  defaultPage: number | null;
  open: boolean;
  onClose: () => void;
}

// One sheet for writing and editing notes: on the book screen, and as a
// "quick thought" from the timer
export function NoteSheet({
  entryId,
  bookTitle,
  note,
  defaultPage,
  open,
  onClose,
}: NoteSheetProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [wasOpen, setWasOpen] = useState(open);
  const save = useSaveNote(entryId, note?.id);

  // Refill on every open: the note being edited, or a fresh one
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      const startPage = note ? note.page : defaultPage;

      setText(note?.text ?? '');
      setPage(startPage === null ? '' : String(startPage));
      save.reset();
    }
  }

  const pageNumber = Number(page);
  const isPageValid =
    page.trim() === '' ||
    (Number.isInteger(pageNumber) &&
      pageNumber >= 1 &&
      pageNumber <= QUOTE_PAGE_MAX);

  function submit() {
    save.mutate(
      {
        text: text.trim(),
        // null on an edit clears a page that was there
        page: page.trim() === '' ? null : pageNumber,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t(note ? 'notes.editTitle' : 'notes.newTitle')}
      subtitle={bookTitle}
    >
      <View className="gap-1.5">
        <TextField
          inSheet
          value={text}
          onChangeText={setText}
          placeholder={t('notes.placeholder')}
          multiline
          autoFocus
          maxLength={NOTE_MAX_LENGTH}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />

        <Text variant="muted" className="text-right text-xs">
          {text.length} / {NOTE_MAX_LENGTH}
        </Text>
      </View>

      <TextField
        inSheet
        label={t('quotes.pageLabel')}
        value={page}
        onChangeText={setPage}
        keyboardType="number-pad"
        placeholder={t('quotes.pageOptional')}
        error={isPageValid ? undefined : t('quotes.pageError')}
      />

      {save.error ? (
        <Text className="text-center text-danger">{save.error.message}</Text>
      ) : null}

      <Button
        title={t('notes.save')}
        disabled={text.trim() === '' || !isPageValid}
        loading={save.isPending}
        onPress={submit}
      />
    </Sheet>
  );
}
