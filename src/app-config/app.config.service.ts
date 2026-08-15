import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV')!;
  }

  get port(): number {
    return +this.configService.get<number>('PORT')!;
  }

  get frontendOrigin(): string {
    return this.configService.get<string>('FRONTEND_ORIGIN')!;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  get jwtExpiresIn(): string | number {
    return this.configService.get<string | number>('JWT_EXPIRES')!;
  }
}
