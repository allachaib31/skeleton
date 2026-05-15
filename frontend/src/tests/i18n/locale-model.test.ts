import { describe, expect, it } from 'vitest';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
};

describe('locale model', () => {
  it('keeps bundled locale files aligned with the English model keys', () => {
    const englishKeys = flattenKeys(en).sort();

    expect(flattenKeys(fr).sort()).toEqual(englishKeys);
    expect(flattenKeys(ar).sort()).toEqual(englishKeys);
  });
});
