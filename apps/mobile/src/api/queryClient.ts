import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './client';

// Default is 3 retries (~7 s of spinner). 4xx won't fix itself; the API
// already retries external services, so one retry is enough here.
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) {
    return false;
  }

  return failureCount < 1;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry },
    },
  });
}
