import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './app-config/app.config.service';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { useContainer } from 'class-validator';
import { updateGlobalConfig } from 'nestjs-paginate';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(AppConfigService);

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

  await app.listen(configService.port);
}
void bootstrap();
