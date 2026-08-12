import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../app-config/app.config.service';
import { UsersService } from '../users/users.service';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { AuthenticatedUser } from './models/authenticated-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    appConfigService: AppConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfigService.jwtSecret,
    });
  }

  async validate(payload: JwtPayloadDto): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.fetchUserDetailsForRequest(
      payload.sub,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      email: user.email,
    };
  }
}
