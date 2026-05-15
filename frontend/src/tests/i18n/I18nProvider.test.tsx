import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '@/config/i18n';
import { I18nProvider } from '@/app/providers/I18nProvider';

describe('I18nProvider', () => {
  it('updates body direction for RTL and LTR languages without DOM text mutation fallback', async () => {
    render(
      <I18nProvider>
        <span>Content</span>
      </I18nProvider>
    );

    await i18n.changeLanguage('ar');
    await waitFor(() => expect(document.body.dir).toBe('rtl'));

    await i18n.changeLanguage('en');
    await waitFor(() => expect(document.body.dir).toBe('ltr'));
  });
});
