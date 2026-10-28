export const NOTE_MAX_LENGTH = 2000;

// A private note on one of your shelf entries
export interface BookNote {
  id: string;
  text: string;
  page: number | null;
  createdAt: string;
  updatedAt: string;
}

// POST /me/books/:id/notes and PATCH /me/notes/:id (page null clears it)
export interface NoteInput {
  text: string;
  page?: number | null;
}
