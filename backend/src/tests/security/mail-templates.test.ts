import { MailService } from '../../modules/mail/mail.service';

describe('mail templates', () => {
  it('escapes dynamic HTML values', () => {
    const html = MailService.getTemplate('welcome', {
      name: '<img src=x onerror=alert(1)>',
      verifyUrl: 'https://example.com/verify?token="bad"',
    });

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
    expect(html).toContain('&quot;bad&quot;');
  });
});
