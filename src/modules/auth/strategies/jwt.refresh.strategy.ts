import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthPayload } from 'src/modules/auth/interfaces/auth.interface';

@Injectable()
export class AuthJwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: AuthJwtRefreshStrategy.extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.refreshToken.secret'),
    });
  }
  static extractJwtFromCookie(req: Request) {
    let token = null;

    if (req && req.cookies) {
      token = req.cookies['refresh_token'];
    }
    return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  }
  async validate(payload: IAuthPayload) {
    return payload;
  }
}
