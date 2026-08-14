import { Module } from '@nestjs/common';
import { DatabaseConfigService } from './database.config.service';
import { AppConfigService } from './app.config.service';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from './config.schema';
import { ObjectStorageConfigService } from './object-storage.config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      validate: (config) => {
        const result = configSchema.safeParse(config);

        if (!result.success) {
          throw new Error(
            `Configuration validation failed:\n${result.error.message}`,
          );
        }

        return result.data;
      },
    }),
  ],
  providers: [
    DatabaseConfigService,
    AppConfigService,
    ObjectStorageConfigService,
  ],
  exports: [
    DatabaseConfigService,
    AppConfigService,
    ObjectStorageConfigService,
  ],
})
export class AppConfigModule {}
