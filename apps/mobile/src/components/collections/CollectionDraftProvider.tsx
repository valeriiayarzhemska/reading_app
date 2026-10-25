import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  COLLECTION_BOOKS_MAX,
  type CollectionBookItem,
  type CollectionDetail,
} from '@reading/shared';

// The editor's [id] when creating: /collection-editor/new
export const NEW_COLLECTION = 'new';

interface CollectionDraft {
  // undefined while creating a new collection
  id: string | undefined;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  // In display order
  books: CollectionBookItem[];
  setBooks: (books: CollectionBookItem[]) => void;
  // Adds to the end, or removes when already there
  toggleBook: (book: CollectionBookItem) => void;
}

const DraftContext = createContext<CollectionDraft | null>(null);

interface CollectionDraftProviderProps {
  // The saved collection when editing; mounted once it's loaded, so the
  // state below starts from it
  initial: CollectionDetail | undefined;
  children: ReactNode;
}

// The editor's two screens (form and book picker) edit one draft. It lives
// in their layout, so it survives moving between them and is gone when the
// editor closes.
export function CollectionDraftProvider({
  initial,
  children,
}: CollectionDraftProviderProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [books, setBooks] = useState(initial?.books ?? []);

  function toggleBook(book: CollectionBookItem) {
    setBooks((current) => {
      if (current.some((item) => item.bookId === book.bookId)) {
        return current.filter((item) => item.bookId !== book.bookId);
      }

      return current.length < COLLECTION_BOOKS_MAX
        ? [...current, book]
        : current;
    });
  }

  return (
    <DraftContext.Provider
      value={{
        id: initial?.id,
        title,
        setTitle,
        description,
        setDescription,
        books,
        setBooks,
        toggleBook,
      }}
    >
      {children}
    </DraftContext.Provider>
  );
}

export function useCollectionDraft(): CollectionDraft {
  const draft = useContext(DraftContext);

  if (!draft) {
    throw new Error('useCollectionDraft must be used inside the editor');
  }

  return draft;
}
