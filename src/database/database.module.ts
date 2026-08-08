import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from '../app-config/database.config.service';
import { AppConfigModule } from '../app-config/app.config.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [DatabaseConfigService],
      useFactory: (config: DatabaseConfigService) => ({
        type: 'postgres',

        host: config.host,
        port: config.port,

        username: config.username,
        password: config.password,
        database: config.database,

        autoLoadEntities: true,

        namingStrategy: new SnakeNamingStrategy(),

        // Database schema changes are managed exclusively through migrations.
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
