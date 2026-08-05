import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T;
  meta: PaginationMeta;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}

type GlobalApiResponse<T> = ApiResponse<T> | PaginatedApiResponse<unknown>;

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('data' in value) || !('meta' in value)) {
    return false;
  }

  const meta = value.meta;

  return (
    typeof meta === 'object' &&
    meta !== null &&
    'page' in meta &&
    typeof meta.page === 'number' &&
    'pageSize' in meta &&
    typeof meta.pageSize === 'number' &&
    'total' in meta &&
    typeof meta.total === 'number'
  );
}

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<
  T,
  GlobalApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<GlobalApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (isPaginatedResult(result)) {
          return {
            success: true,
            data: result.data,
            meta: result.meta,
          };
        }

        return {
          success: true,
          data: result,
        };
      }),
    );
  }
}
