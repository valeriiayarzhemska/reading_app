// Only the fields we read. Full reference:
// https://developers.google.com/books/docs/v1/reference/volumes

export interface GoogleVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    language?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
    };
  };
}

export interface GoogleVolumesResponse {
  totalItems: number;
  items?: GoogleVolume[]; // missing when nothing is found
}
