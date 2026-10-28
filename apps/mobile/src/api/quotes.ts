import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BookQuote, PostItem, QuoteInput } from '@reading/shared';

import { apiFetch } from './client';

const quotesKey = (entryId: string) => ['quotes', entryId] as const;

export function useQuotes(entryId: string) {
  return useQuery({
    queryKey: quotesKey(entryId),
    queryFn: () => apiFetch<BookQuote[]>(`/me/books/${entryId}/quotes`),
  });
}

export function useAddQuote(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuoteInput) =>
      apiFetch<BookQuote>(`/me/books/${entryId}/quotes`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    // Newest first, as the server orders them
    onSuccess: (quote) =>
      queryClient.setQueryData<BookQuote[]>(quotesKey(entryId), (quotes) =>
        quotes ? [quote, ...quotes] : [quote],
      ),
  });
}

export function useDeleteQuote(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) =>
      apiFetch<void>(`/me/quotes/${quoteId}`, { method: 'DELETE' }),
    onSuccess: (_result, quoteId) =>
      queryClient.setQueryData<BookQuote[]>(quotesKey(entryId), (quotes) =>
        quotes?.filter((quote) => quote.id !== quoteId),
      ),
  });
}

export function useShareQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) =>
      apiFetch<PostItem>(`/me/quotes/${quoteId}/share`, { method: 'POST' }),
    // A new post on Shelves
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}
