import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('DB_HOST')!;
  }

  get port(): number {
    return +this.configService.get<number>('DB_PORT')!;
  }

  get username(): string {
    return this.configService.get<string>('DB_USERNAME')!;
  }

  get password(): string {
    return this.configService.get<string>('DB_PASSWORD')!;
  }

  get database(): string {
    return this.configService.get<string>('DB_NAME')!;
  }
}
