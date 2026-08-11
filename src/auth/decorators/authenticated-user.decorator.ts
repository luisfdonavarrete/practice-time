import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserDto } from '../dto/authenticated-user.dto';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUserDto => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUserDto }>();
    return request.user;
  },
);
