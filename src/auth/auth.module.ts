import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HashingModule } from '../hashing/hashing.module';
import { UsersModule } from '../users/users.module';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { AppConfigModule } from '../app-config/app.config.module';
import { AppConfigService } from '../app-config/app.config.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    HashingModule,
    UsersModule,
    AppConfigModule,
    JwtModule.registerAsync({
      global: true,
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        return {
          secret: config.jwtSecret,
          signOptions: {
            expiresIn: config.jwtExpiresIn as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
