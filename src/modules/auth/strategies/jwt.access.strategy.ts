import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAuthPayload } from 'src/modules/auth/interfaces/auth.interface';
import { Request } from 'express';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class AuthJwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: AuthJwtAccessStrategy.extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.accessToken.secret'),
    });
  }
  static extractJwtFromCookie(req: Request) {
    let token = null;
    //console.log(req['cookies']);
    if (req && req.cookies) {
      token = req.cookies['access_token'];
    }
    return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  }
  async validate(payload: Partial<IAuthPayload>) {
    const user = await this.userService.getUserById(payload.id);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      accountStatus: user.account_status,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  }
}
