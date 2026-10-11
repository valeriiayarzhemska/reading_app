// Only the fields we request (search.json?fields=...). Reference:
// https://openlibrary.org/dev/docs/api/search

export interface OpenLibraryWork {
  key: string; // "/works/OL17860744W"
  title?: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibraryWork[];
}
