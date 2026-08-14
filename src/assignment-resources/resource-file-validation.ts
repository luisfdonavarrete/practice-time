import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';

const signatures: Array<{
  mimeType: string;
  matches: (value: Buffer) => boolean;
}> = [
  {
    mimeType: 'application/pdf',
    matches: (value) => value.subarray(0, 5).toString() === '%PDF-',
  },
  {
    mimeType: 'image/png',
    matches: (value) =>
      value
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: 'image/jpeg',
    matches: (value) =>
      value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff,
  },
  {
    mimeType: 'image/gif',
    matches: (value) =>
      ['GIF87a', 'GIF89a'].includes(value.subarray(0, 6).toString()),
  },
  {
    mimeType: 'image/webp',
    matches: (value) =>
      value.subarray(0, 4).toString() === 'RIFF' &&
      value.subarray(8, 12).toString() === 'WEBP',
  },
  {
    mimeType: 'audio/mpeg',
    matches: (value) =>
      value.subarray(0, 3).toString() === 'ID3' ||
      (value[0] === 0xff && (value[1] & 0xe0) === 0xe0),
  },
];

export function validateResourceFile(
  file: Express.Multer.File | undefined,
  maxBytes: number,
): string {
  if (!file || file.size === 0) {
    throw new BadRequestException('A non-empty file is required');
  }
  if (file.size > maxBytes) {
    throw new PayloadTooLargeException(
      `File exceeds the ${maxBytes}-byte limit`,
    );
  }
  const detected = signatures.find(({ matches }) => matches(file.buffer));
  if (!detected || detected.mimeType !== file.mimetype.toLowerCase()) {
    throw new BadRequestException(
      'File content does not match an allowed MIME type',
    );
  }
  return detected.mimeType;
}

export function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, 255);
  return sanitized || 'resource';
}
