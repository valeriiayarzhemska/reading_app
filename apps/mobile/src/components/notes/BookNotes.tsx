import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  ProgressUnit,
  type BookNote,
  type UserBookWithBook,
} from '@reading/shared';

import { NoteSheet } from '@/components/notes/NoteSheet';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

import { useDeleteNote, useNotes } from '@/api/notes';
import { currentLanguage } from '@/i18n';

function noteDate(iso: string): string {
  return new Intl.DateTimeFormat(currentLanguage(), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

// "Notes" on your book screen: private, tap to edit, long-press to delete
export function BookNotes({ entry }: { entry: UserBookWithBook }) {
  const { t } = useTranslation();
  const { data: notes = [] } = useNotes(entry.id);
  const remove = useDeleteNote(entry.id);
  const [editing, setEditing] = useState<BookNote | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // A new note starts at the page you're on
  const currentPage =
    entry.progressUnit === ProgressUnit.PAGES && entry.currentProgress > 0
      ? entry.currentProgress
      : null;

  function openNote(note: BookNote | null) {
    setEditing(note);
    setIsOpen(true);
  }

  function confirmDelete(note: BookNote) {
    Alert.alert(t('notes.deleteTitle'), undefined, [
      { text: t('book.cancel'), style: 'cancel' },
      {
        text: t('quotes.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(note.id),
      },
    ]);
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text variant="heading">{t('notes.title')}</Text>

          <Text variant="muted" className="text-xs">
            {t('notes.private')}
          </Text>
        </View>

        <Pressable
          onPress={() => openNote(null)}
          accessibilityRole="button"
          className="active:opacity-60"
        >
          <Text variant="label" className="text-accent">
            {t('quotes.add')}
          </Text>
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <Text variant="muted">{t('notes.empty')}</Text>
      ) : null}

      {notes.map((note) => (
        <Pressable
          key={note.id}
          onPress={() => openNote(note)}
          onLongPress={() => confirmDelete(note)}
          delayLongPress={300}
          className="active:opacity-80"
        >
          <Card className="gap-1.5">
            <Text>{note.text}</Text>

            <Text variant="muted" className="text-xs">
              {note.page !== null
                ? `${t('quotes.page', { page: note.page })} · `
                : ''}
              {noteDate(note.createdAt)}
            </Text>
          </Card>
        </Pressable>
      ))}

      <NoteSheet
        entryId={entry.id}
        bookTitle={entry.book.title}
        note={editing}
        defaultPage={currentPage}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </View>
  );
}
