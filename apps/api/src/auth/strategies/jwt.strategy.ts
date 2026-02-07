import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AppLoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private logger: AppLoggerService
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'change-me-in-production';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    this.logger.setContext('JwtStrategy');
  }

  async validate(payload: { sub: string; email: string; organizationId: string; role: string }) {
    if (!payload.sub || !payload.email) {
      this.logger.warn('JWT validation failed: missing sub or email');
      throw new UnauthorizedException('Invalid token');
    }
    this.logger.debug('JWT validated', { userId: payload.sub, organizationId: payload.organizationId });
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
    };
  }
}
