import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { LoginFailedException } from '../exceptions/login-failed.exception';

@Catch(LoginFailedException)
@Injectable()
export class LoginFailedExceptionFilter implements ExceptionFilter<LoginFailedException> {
  private readonly baseExceptionFilter: BaseExceptionFilter;

  constructor(httpAdapterHost: HttpAdapterHost) {
    this.baseExceptionFilter = new BaseExceptionFilter(
      httpAdapterHost.httpAdapter,
    );
  }

  catch(_exception: LoginFailedException, host: ArgumentsHost): void {
    this.baseExceptionFilter.catch(new UnauthorizedException(), host);
  }
}
