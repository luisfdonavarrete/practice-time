import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DuplicateEmailException } from '../exceptions/duplicate-email.exception';
import { DuplicateEmailExceptionFilter } from './duplicate-email-exception.filter';

describe('DuplicateEmailExceptionFilter', () => {
  it('translates a duplicate email exception to a conflict response', () => {
    const response = {};
    const reply = jest.fn();
    const httpAdapterHost = {
      httpAdapter: {
        isHeadersSent: () => false,
        reply,
      },
    };
    const host = {
      getArgByIndex: (index: number) => (index === 1 ? response : undefined),
    } as ArgumentsHost;

    new DuplicateEmailExceptionFilter(
      httpAdapterHost as unknown as HttpAdapterHost,
    ).catch(new DuplicateEmailException('student@example.com'), host);

    expect(reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Email student@example.com is already registered',
        error: 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
  });
});
