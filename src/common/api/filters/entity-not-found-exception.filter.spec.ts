import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { EntityNotFoundError } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { EntityNotFoundExceptionFilter } from './entity-not-found-exception.filter';

describe('EntityNotFoundExceptionFilter', () => {
  it('translates an entity not found error to a generic not found response', () => {
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

    new EntityNotFoundExceptionFilter(
      httpAdapterHost as unknown as HttpAdapterHost,
    ).catch(
      new EntityNotFoundError(User, {
        id: '018f0542-f7c8-7d56-a4c8-53bffd426a9a',
      }),
      host,
    );

    expect(reply).toHaveBeenCalledWith(
      response,
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  });
});
