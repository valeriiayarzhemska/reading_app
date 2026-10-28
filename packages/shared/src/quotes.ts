export const QUOTE_MAX_LENGTH = 1000;
export const QUOTE_PAGE_MAX = 20000;

// A saved quote on one of your shelf entries (private)
export interface BookQuote {
  id: string;
  text: string;
  page: number | null;
  createdAt: string;
}

// POST /me/books/:id/quotes
export interface QuoteInput {
  text: string;
  page?: number;
}
