export interface RetryOptions {
  attempts?: number;
  // Pause before retry N is delayMs * N
  delayMs?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

// Retries network errors and 5xx (usually brief outages), not 4xx (won't fix
// itself). Returns null if the service was never reachable.
export async function fetchWithRetry(
  url: URL,
  { attempts = 3, delayMs = 300, timeoutMs = 5000, headers }: RetryOptions = {},
): Promise<Response | null> {
  let attempt = 0;

  while (true) {
    attempt++;
    const res = await fetchOnce(url, timeoutMs, headers);
    const isRetryable = !res || res.status >= 500;

    if (!isRetryable || attempt >= attempts) {
      return res;
    }

    await sleep(delayMs * attempt);
  }
}

// null = network error or timeout
async function fetchOnce(
  url: URL,
  timeoutMs: number,
  headers?: Record<string, string>,
): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
