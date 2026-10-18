import { describe, expect, it } from 'vitest';

import { heatLevel } from '@reading/shared';

describe('heatLevel', () => {
  it('maps minutes to the five color steps', () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(1)).toBe(1);
    expect(heatLevel(14)).toBe(1);
    expect(heatLevel(15)).toBe(2);
    expect(heatLevel(30)).toBe(3);
    expect(heatLevel(59)).toBe(3);
    expect(heatLevel(60)).toBe(4);
    expect(heatLevel(300)).toBe(4);
  });
});
