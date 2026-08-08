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
  private readonly baseExceptionFilter: BaseExceptionFilter;

  constructor(httpAdapterHost: HttpAdapterHost) {
    this.baseExceptionFilter = new BaseExceptionFilter(
      httpAdapterHost.httpAdapter,
    );
  }

  catch(_exception: EntityNotFoundError, host: ArgumentsHost): void {
    this.baseExceptionFilter.catch(new NotFoundException(), host);
  }
}
