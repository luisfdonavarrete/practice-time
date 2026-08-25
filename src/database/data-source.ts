import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { configSchema } from '../app-config/config.schema';

const nodeEnv = process.env.NODE_ENV ?? 'development';
loadEnv({ path: [`.env.${nodeEnv}`, '.env'], quiet: true });

const config = configSchema.parse(process.env);

export default new DataSource({
  type: 'postgres',
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  namingStrategy: new SnakeNamingStrategy(),

  synchronize: false,
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  migrationsTableName: 'migrations',
});
