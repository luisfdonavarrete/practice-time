import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './app-config/app.config.service';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { GlobalResponseInterceptor } from './common/api/interceptors/global-response.interceptor';
import { LoggerInterceptor } from './common/api/interceptors/logger.interceptor';
import { useContainer } from 'class-validator';

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

  await app.listen(configService.port);
}
void bootstrap();
