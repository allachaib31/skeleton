import { csrfOriginGuard } from '../../middlewares/csrf.middleware';

const createReq = (headers: Record<string, string | undefined>) =>
  ({
    get: (name: string) => headers[name.toLowerCase()],
  }) as any;

describe('csrfOriginGuard', () => {
  it('allows requests from configured client origins', () => {
    const next = jest.fn();

    csrfOriginGuard(createReq({ origin: 'http://localhost:3000' }), {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects browser requests from unknown origins', () => {
    const next = jest.fn();

    csrfOriginGuard(createReq({ origin: 'https://evil.example' }), {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
