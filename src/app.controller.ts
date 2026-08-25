import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get('health')
  async getHealth(): Promise<{
    status: 'ready';
    checks: { database: 'up' };
  }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ready', checks: { database: 'up' } };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        checks: { database: 'down' },
      });
    }
  }

  @Public()
  @Get('health/live')
  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
