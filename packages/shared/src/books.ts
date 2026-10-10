// A book as returned by GET /books/search — not saved in our database yet.
export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  language: string | null;
}
