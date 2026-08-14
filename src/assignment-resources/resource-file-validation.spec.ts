import {
  sanitizeFilename,
  validateResourceFile,
} from './resource-file-validation';

const file = (buffer: Buffer, mimetype: string) =>
  ({ buffer, size: buffer.length, mimetype }) as Express.Multer.File;

describe('resource file validation', () => {
  it('accepts supported content when its declared MIME type matches', () => {
    expect(
      validateResourceFile(
        file(Buffer.from('%PDF-1.7 content'), 'application/pdf'),
        1024,
      ),
    ).toBe('application/pdf');
  });

  it('rejects MIME spoofing and oversized files', () => {
    expect(() =>
      validateResourceFile(
        file(Buffer.from('%PDF-1.7 content'), 'image/png'),
        1024,
      ),
    ).toThrow('does not match');
    expect(() =>
      validateResourceFile(
        file(Buffer.from('%PDF-1.7 content'), 'application/pdf'),
        4,
      ),
    ).toThrow('exceeds');
  });

  it('removes paths and control characters from stored filenames', () => {
    expect(sanitizeFilename('../../unsafe\u0000.pdf')).toBe('unsafe.pdf');
    expect(sanitizeFilename('..\\windows\\song.mp3')).toBe('song.mp3');
  });
});
