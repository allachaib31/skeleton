import { I18nService } from '../../modules/i18n/i18n.service';

describe('I18nService', () => {
  it('rejects uploaded language files that miss model keys', async () => {
    await expect(
      I18nService.upsertLanguage({
        code: 'zz',
        name: 'Test',
        direction: 'ltr',
        content: Buffer.from(JSON.stringify({ common: { save: 'Save' } })),
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('accepts uploaded language files that match the English model keys', async () => {
    const template = await I18nService.getTemplate();

    const language = await I18nService.upsertLanguage({
      code: 'zz',
      name: 'Test Language',
      direction: 'ltr',
      content: Buffer.from(JSON.stringify(template)),
    });

    expect(language.code).toBe('zz');
    expect(language.direction).toBe('ltr');
    expect(language.isCustom).toBe(true);
  });
});
