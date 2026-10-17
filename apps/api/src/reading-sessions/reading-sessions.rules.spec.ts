import { describe, expect, it } from 'vitest';

import { ProgressUnit, sessionProgressError } from '@reading/shared';

import { sessionTimeError } from './reading-sessions.rules.js';

const NOW = new Date('2026-10-16T20:00:00Z');
const at = (time: string) => new Date(`2026-10-16T${time}Z`);

describe('sessionTimeError', () => {
  it('accepts a session with a pause (duration shorter than the span)', () => {
    expect(sessionTimeError(at('18:00:00'), at('19:00:00'), 1800, NOW)).toBe(
      null,
    );
  });

  it('rejects an end before the start', () => {
    expect(sessionTimeError(at('19:00:00'), at('18:00:00'), 60, NOW)).toMatch(
      'after startedAt',
    );
  });

  it('allows a few minutes of clock difference, not more', () => {
    expect(sessionTimeError(at('19:30:00'), at('20:03:00'), 60, NOW)).toBe(
      null,
    );
    expect(sessionTimeError(at('19:30:00'), at('20:30:00'), 60, NOW)).toMatch(
      'future',
    );
  });

  it('rejects a duration longer than the span', () => {
    expect(sessionTimeError(at('18:00:00'), at('18:10:00'), 900, NOW)).toMatch(
      'durationSec',
    );
  });

  it('rejects a session over 24 hours', () => {
    expect(
      sessionTimeError(
        new Date('2026-10-15T10:00:00Z'),
        at('11:00:00'),
        60,
        NOW,
      ),
    ).toMatch('24 hours');
  });
});

describe('sessionProgressError', () => {
  it('rejects ending before the start page', () => {
    expect(sessionProgressError(ProgressUnit.PAGES, 90, 80, 300)).toBe(
      'beforeStart',
    );
  });

  it('accepts reading zero pages', () => {
    expect(sessionProgressError(ProgressUnit.PAGES, 90, 90, 300)).toBe(null);
  });

  it('rejects going past the last page', () => {
    expect(sessionProgressError(ProgressUnit.PAGES, 290, 310, 300)).toBe(
      'overPages',
    );
  });
});
