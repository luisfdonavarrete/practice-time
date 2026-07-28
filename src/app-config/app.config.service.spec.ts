import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app.config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'test';
              if (key === 'PORT') return 3000;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return nodeEnv', () => {
    expect(service.nodeEnv).toBe('test');
    expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
  });

  it('should return port', () => {
    expect(service.port).toBe(3000);
    expect(configService.get).toHaveBeenCalledWith('PORT');
  });
});
