export const COLLECTION_TITLE_MAX = 80;
export const COLLECTION_DESCRIPTION_MAX = 500;
export const COLLECTION_BOOKS_MAX = 100;
// The cover is a 2×2 collage of the first books
export const COLLAGE_SIZE = 4;

// A card on a profile
export interface CollectionSummary {
  id: string;
  title: string;
  bookCount: number;
  // The first COLLAGE_SIZE books' covers, in order (null: no cover)
  covers: (string | null)[];
  likesCount: number;
}

export interface CollectionBookItem {
  bookId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
}

// GET /collections/:id
export interface CollectionDetail {
  id: string;
  title: string;
  description: string | null;
  author: {
    nickname: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isMine: boolean;
  likesCount: number;
  isLiked: boolean;
  // In the author's order
  books: CollectionBookItem[];
}

// POST /me/collections and PUT /me/collections/:id: the whole collection
export interface CollectionInput {
  title: string;
  description: string | null;
  bookIds: string[];
}
