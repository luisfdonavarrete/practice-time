import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './app-config/app.config.service';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { useContainer } from 'class-validator';
import { updateGlobalConfig } from 'nestjs-paginate';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import { Server, type ServerOptions } from 'socket.io';
import { configureOpenApi } from './common/api/open-api';
import { NestExpressApplication } from '@nestjs/platform-express';

class FrontendIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly frontendOrigin: string,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: unknown = super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.frontendOrigin,
        allowedHeaders: ['Authorization'],
      },
    });

    return server as Server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(AppConfigService);

  app.enableCors({
    origin: configService.frontendOrigin,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useWebSocketAdapter(
    new FrontendIoAdapter(app, configService.frontendOrigin),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(
    new GlobalResponseInterceptor(),
    new LoggerInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  updateGlobalConfig({
    defaultOrigin: undefined,
    defaultLimit: 20,
    defaultMaxLimit: 100,
  });

  configureOpenApi(app, configService.nodeEnv);

  app.set('trust proxy', 1);
  await app.listen(configService.port);
}
void bootstrap();
