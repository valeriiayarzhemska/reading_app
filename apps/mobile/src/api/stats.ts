import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { CalendarMonth } from '@reading/shared';

import { apiFetch } from './client';

// ['calendar'] prefix: invalidating it refreshes every loaded month
export const calendarKey = (month: string) => ['calendar', month] as const;

export function useCalendar(month: string) {
  return useQuery({
    queryKey: calendarKey(month),
    queryFn: () => apiFetch<CalendarMonth>(`/me/calendar?month=${month}`),
    // While the next month loads, keep showing the current one instead of
    // flashing a spinner on every ‹ ›
    placeholderData: keepPreviousData,
  });
}
