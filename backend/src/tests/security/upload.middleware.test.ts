import { scanUploadedFiles, uploadPolicies, validateImageFileSignature } from '../../middlewares/upload.middleware';

const createReqWithFile = (mimetype: string, buffer: Buffer) =>
  ({
    file: {
      mimetype,
      buffer,
    },
  }) as any;

describe('validateImageFileSignature', () => {
  it('allows files when MIME type and content signature match', () => {
    const next = jest.fn();
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    validateImageFileSignature(createReqWithFile('image/png', pngSignature), {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects files when content does not match the declared MIME type', () => {
    const next = jest.fn();

    validateImageFileSignature(createReqWithFile('image/png', Buffer.from('not a png')), {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('defines an explicit avatar upload type and size policy', () => {
    expect(uploadPolicies.avatar.allowedMimeTypes).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    expect(uploadPolicies.avatar.maxSizeBytes).toBe(5 * 1024 * 1024);
  });

  it('rejects files matching the malware scanner test signature', () => {
    const next = jest.fn();
    const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!');

    scanUploadedFiles(createReqWithFile('image/png', eicar), {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
