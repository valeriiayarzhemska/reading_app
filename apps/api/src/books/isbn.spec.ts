import { describe, expect, it } from 'vitest';

import { normalizeIsbn } from '@reading/shared';

describe('normalizeIsbn', () => {
  it('accepts ISBN-13 with hyphens and spaces', () => {
    expect(normalizeIsbn('978-0-14-143951-8')).toBe('9780141439518');
    expect(normalizeIsbn(' 978 0141439518 ')).toBe('9780141439518');
  });

  it('accepts ISBN-10, including the X checksum', () => {
    expect(normalizeIsbn('0-14-143951-3')).toBe('0141439513');
    expect(normalizeIsbn('080442957x')).toBe('080442957X');
  });

  it('rejects a wrong checksum', () => {
    expect(normalizeIsbn('9780141439519')).toBeNull();
    expect(normalizeIsbn('0141439514')).toBeNull();
  });

  it('rejects text and other numbers', () => {
    expect(normalizeIsbn('pride and prejudice')).toBeNull();
    expect(normalizeIsbn('1984')).toBeNull();
    expect(normalizeIsbn('X141439513')).toBeNull();
  });
});
