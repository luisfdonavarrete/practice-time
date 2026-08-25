import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;
  const query = jest.fn<Promise<unknown>, [string]>();

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: DataSource, useValue: { query } }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    beforeEach(() => query.mockReset());

    it('reports readiness after querying the database', async () => {
      query.mockResolvedValue([{ '?column?': 1 }]);

      await expect(appController.getHealth()).resolves.toEqual({
        status: 'ready',
        checks: { database: 'up' },
      });
      expect(query).toHaveBeenCalledWith('SELECT 1');
    });

    it('returns a safe unavailable response when the database is down', async () => {
      query.mockRejectedValue(
        new Error('connection details must stay private'),
      );

      await expect(appController.getHealth()).rejects.toEqual(
        new ServiceUnavailableException({
          status: 'not_ready',
          checks: { database: 'down' },
        }),
      );
    });

    it('reports process liveness without querying dependencies', () => {
      expect(appController.getLiveness()).toEqual({ status: 'ok' });
      expect(query).not.toHaveBeenCalled();
    });
  });
});
