import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

function isPaginated(result: unknown): result is {
  data: unknown[];
  meta: unknown;
  links: unknown;
} {
  return (
    typeof result === 'object' &&
    result !== null &&
    'data' in result &&
    Array.isArray(result.data) &&
    'meta' in result &&
    'links' in result
  );
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>) {
    return next
      .handle()
      .pipe(
        map((result) =>
          isPaginated(result)
            ? { success: true, ...result }
            : { success: true, data: result },
        ),
      );
  }
}
