import { describe, expect, it } from 'vitest';

import { isTimeZone } from './timezone.validator.js';

describe('isTimeZone', () => {
  it('accepts IANA names, including old aliases', () => {
    expect(isTimeZone('Europe/Kyiv')).toBe(true);
    expect(isTimeZone('Europe/Kiev')).toBe(true);
    expect(isTimeZone('America/New_York')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(isTimeZone("UTC'; DROP TABLE")).toBe(false);
    expect(isTimeZone('')).toBe(false);
    expect(isTimeZone(3)).toBe(false);
  });
});
