import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { EntityNotFoundError } from 'typeorm';

@Catch(EntityNotFoundError)
@Injectable()
export class EntityNotFoundExceptionFilter implements ExceptionFilter<EntityNotFoundError> {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(_exception: EntityNotFoundError, host: ArgumentsHost): void {
    new BaseExceptionFilter(this.httpAdapterHost.httpAdapter).catch(
      new NotFoundException(),
      host,
    );
  }
}
