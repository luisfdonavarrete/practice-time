import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { GlobalResponseInterceptor } from './global-response.interceptor';

describe('GlobalResponseInterceptor', () => {
  it('wraps a regular response', async () => {
    const next = { handle: () => of({ id: 'student-id' }) } as CallHandler;

    const response = await firstValueFrom(
      new GlobalResponseInterceptor().intercept({} as ExecutionContext, next),
    );

    expect(response).toEqual({
      success: true,
      data: { id: 'student-id' },
    });
  });

  it('preserves paginated data, metadata, and links at the top level', async () => {
    const paginated = {
      data: [{ id: 'student-id' }],
      meta: {
        itemsPerPage: 20,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['id', 'DESC']],
        searchBy: [],
        search: '',
        select: [],
      },
      links: {
        current: '/students?page=1&limit=20',
      },
    };
    const next = { handle: () => of(paginated) } as CallHandler;

    const response = await firstValueFrom(
      new GlobalResponseInterceptor().intercept({} as ExecutionContext, next),
    );

    expect(response).toEqual({
      success: true,
      ...paginated,
    });
  });
});
