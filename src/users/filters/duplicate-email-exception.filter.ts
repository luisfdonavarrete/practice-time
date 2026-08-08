import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  Injectable,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { DuplicateEmailException } from '../exceptions/duplicate-email.exception';

@Catch(DuplicateEmailException)
@Injectable()
export class DuplicateEmailExceptionFilter implements ExceptionFilter<DuplicateEmailException> {
  private readonly baseExceptionFilter: BaseExceptionFilter;

  constructor(httpAdapterHost: HttpAdapterHost) {
    this.baseExceptionFilter = new BaseExceptionFilter(
      httpAdapterHost.httpAdapter,
    );
  }

  catch(exception: DuplicateEmailException, host: ArgumentsHost): void {
    this.baseExceptionFilter.catch(
      new ConflictException(exception.message),
      host,
    );
  }
}
