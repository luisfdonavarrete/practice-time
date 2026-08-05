import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './app-config/app.config.service';
import { ValidationPipe } from '@nestjs/common';
import { GlobalResponseInterceptor } from './common/api/interceptors/global-response.interceptor';

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

  app.useGlobalInterceptors(new GlobalResponseInterceptor());

  await app.listen(configService.port);
}
void bootstrap();
