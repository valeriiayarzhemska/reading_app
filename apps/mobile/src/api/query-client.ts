import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

// React Query retries 3 times by default (~7 s of spinner on a failure).
// 4xx means our request is wrong — retrying won't help. 5xx and network
// errors get one retry; the API already retries Google on its side.
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
