import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { CalendarMonth, DaySession } from '@reading/shared';

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

export const daySessionsKey = (date: string) => ['daySessions', date] as const;

// Sessions of one day for the day sheet; loads only while a day is open
export function useDaySessions(date: string | null) {
  return useQuery({
    queryKey: daySessionsKey(date ?? ''),
    queryFn: () => apiFetch<DaySession[]>(`/me/sessions?date=${date}`),
    enabled: date !== null,
  });
}
