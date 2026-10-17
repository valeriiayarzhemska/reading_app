// The phone's clock can be a bit ahead of the server's
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_SESSION_MS = 24 * 60 * 60 * 1000;

export function sessionTimeError(
  startedAt: Date,
  endedAt: Date,
  durationSec: number,
  now = new Date(),
): string | null {
  const spanMs = endedAt.getTime() - startedAt.getTime();

  if (spanMs <= 0) {
    return 'endedAt must be after startedAt';
  }

  if (endedAt.getTime() > now.getTime() + CLOCK_SKEW_MS) {
    return 'A session cannot end in the future';
  }

  if (spanMs > MAX_SESSION_MS) {
    return 'A session cannot be longer than 24 hours';
  }

  // +1: the app rounds to whole seconds
  if (durationSec > spanMs / 1000 + 1) {
    return 'durationSec cannot exceed the time between startedAt and endedAt';
  }

  return null;
}
