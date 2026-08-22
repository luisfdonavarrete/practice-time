import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureOpenApi(
  app: INestApplication,
  nodeEnv: string,
): boolean {
  if (nodeEnv === 'production') return false;

  const config = new DocumentBuilder()
    .setTitle('Practice Time API')
    .setDescription(
      'Assignment-first music practice API. Authenticate with /auth/login, then use the returned JWT as a Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT returned by POST /auth/login',
      },
      'bearer',
    )
    .addTag('authentication')
    .addTag('students')
    .addTag('weekly assignments')
    .addTag('assignment resources')
    .addTag('practice')
    .addTag('achievements')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
  return true;
}
