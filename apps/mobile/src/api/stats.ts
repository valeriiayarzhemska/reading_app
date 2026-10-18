import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  CalendarMonth,
  CalendarYear,
  DaySession,
  ReadingGoal,
  StatsSummary,
} from '@reading/shared';

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

export const statsKey = ['stats'] as const;

export function useStats() {
  return useQuery({
    queryKey: statsKey,
    queryFn: () => apiFetch<StatsSummary>('/me/stats'),
  });
}

export function useSetGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ year, target }: ReadingGoal) =>
      apiFetch<ReadingGoal>(`/me/goals/${year}`, {
        method: 'PUT',
        body: JSON.stringify({ target }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: statsKey }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (year: number) =>
      apiFetch<void>(`/me/goals/${year}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: statsKey }),
  });
}

// Under ['calendar'], so the invalidation after a saved session refreshes it
export const calendarYearKey = (year: number) =>
  ['calendar', 'year', year] as const;

export function useCalendarYear(year: number) {
  return useQuery({
    queryKey: calendarYearKey(year),
    queryFn: () => apiFetch<CalendarYear>(`/me/calendar/year?year=${year}`),
    placeholderData: keepPreviousData,
  });
}
