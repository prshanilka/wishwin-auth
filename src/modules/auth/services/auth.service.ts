import { randomInt } from 'crypto';

import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { nanoid } from 'nanoid';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { Status } from 'src/enums/common';

import {
  IAuthPayload,
  IAuthResponse,
  ITokenResponse,
  TokenType,
} from '../interfaces/auth.interface';
import { UserService } from '../../user/services/user.service';
import { HelperHashService } from '../../../common/services/helper.hash.service';
import { IAuthService } from '../interfaces/auth.service.interface';
import { AuthResponseDto } from '../dtos/auth.response.dto';
import { AuthLoginDto, AuthOTPLoginDto } from '../dtos/auth.login.dto';
import { AuthSignupDto } from '../dtos/auth.signup.dto';
import { RedisService } from '../../../common/services/redis.service';
import { AuthOTPRequestDto } from '../dtos/auth.otp.request.dto';

@Injectable()
export class AuthService implements IAuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExp: string;
  private readonly refreshTokenExp: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly helperHashService: HelperHashService,
    private readonly i18n: I18nService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject('NOTIFICATION_SERVICE') private readonly authClient: ClientProxy,
  ) {
    this.accessTokenSecret = this.configService.get<string>(
      'auth.accessToken.secret',
    );
    this.refreshTokenSecret = this.configService.get<string>(
      'auth.refreshToken.secret',
    );
    this.accessTokenExp = this.configService.get<string>(
      'auth.accessToken.expirationTime',
    );
    this.refreshTokenExp = this.configService.get<number>(
      'auth.refreshToken.expirationTime',
    );
    this.authClient.connect();
  }

  private async setTokens(
    req: Request,
    {
      accessToken,
      refreshToken,
    }: { accessToken: string; refreshToken?: string },
  ) {
    req.res.cookie('access_token', accessToken, {
      maxAge: 1000 * 60 * 60 * 1,
      httpOnly: true,
      sameSite: 'lax',
    });

    if (refreshToken) {
      req.res.cookie('refresh_token', refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: true,
      });
    }
  }

  async verifyToken(accessToken: string): Promise<IAuthPayload> {
    try {
      const data = await this.jwtService.verifyAsync(accessToken, {
        secret: this.accessTokenSecret,
      });

      return data;
    } catch (e) {
      throw e;
    }
  }

  async generateTokens(user: Partial<IAuthPayload>): Promise<ITokenResponse> {
    try {
      const jwtid = nanoid();
      const accessTokenPromise = this.jwtService.signAsync(
        {
          id: user.id,
          role: user.role,
          tokenType: TokenType.ACCESS_TOKEN,
        },
        {
          secret: this.accessTokenSecret,
          expiresIn: this.accessTokenExp,
        },
      );

      const refreshTokenPromise = this.jwtService.signAsync(
        {
          id: user.id,
          role: user.role,
          tokenType: TokenType.REFRESH_TOKEN,
        },
        {
          jwtid,
          secret: this.refreshTokenSecret,
          expiresIn: this.refreshTokenExp,
        },
      );

      const [accessToken, refreshToken] = await Promise.all([
        accessTokenPromise,
        refreshTokenPromise,
      ]);
      await this.redisService.saveRefreshToken(
        user.id,
        jwtid,
        this.refreshTokenExp,
      );
      return {
        accessToken,
        refreshToken,
      };
    } catch (e) {
      throw e;
    }
  }

  async login(data: AuthLoginDto, req: Request): Promise<AuthResponseDto> {
    try {
      const { email, password } = data;

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        throw new NotFoundException('user.userNotFound');
      }

      const match = await this.helperHashService.match(user.password, password);

      if (!match) {
        throw new NotFoundException('user.invalidPassword');
      }

      const { accessToken, refreshToken } = await this.generateTokens({
        id: user.id,
        role: user.role,
      });
      await this.setTokens(req, { accessToken, refreshToken });
      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (e) {
      throw e;
    }
  }
  async OTPlogin(
    data: AuthOTPLoginDto,
    req: Request,
  ): Promise<AuthResponseDto> {
    try {
      const { phone, otp } = data;
      const isOTPVerified = await this.redisService.verifyOTP(phone, otp);
      if (!isOTPVerified) {
        throw new NotFoundException('auth.otp.incorrect');
      }
      const user = await this.userService.getUserByUserName(phone);
      if (!user) {
        throw new NotFoundException('user.userNotFound');
      }

      const { accessToken, refreshToken } = await this.generateTokens({
        id: user.id,
        role: user.role,
      });
      await this.setTokens(req, { accessToken, refreshToken });
      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (e) {
      throw e;
    }
  }
  async signup(data: AuthSignupDto): Promise<AuthResponseDto> {
    try {
      const {
        firstName,
        lastName,
        username,
        school,
        district,
        address,
        dob,
        otp,
      } = data;
      const isOTPVerified = await this.redisService.verifyOTP(username, otp);
      if (!isOTPVerified) {
        throw new HttpException(
          {
            statusCode: HttpStatus.OK,
            message: 'auth.otp.incorrect',
          },
          HttpStatus.OK,
        );
      }
      const findByUserName = await this.userService.getUserByUserName(username);

      if (findByUserName) {
        throw new ConflictException('user.userExistsByUserName');
      }

      const createdUser = await this.userService.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username,
        school: school.trim(),
        district: district,
        address: address.trim(),
        dob: dob,
      });

      const tokens = await this.generateTokens({
        id: createdUser.id,
        role: createdUser.role,
      });

      return {
        ...tokens,
        user: createdUser,
      };
    } catch (e) {
      throw e;
    }
  }

  async sendOTP(user: AuthOTPRequestDto): Promise<IAuthResponse> {
    const otpExpirationTime = this.configService.get<number>(
      'app.sms.otpExpirationTime',
    );
    const rateLimitTime = this.configService.get<number>(
      'app.sms.rateLimitTime',
    );
    const maxOTPRequests = this.configService.get<number>(
      'app.sms.maxOTPRequests',
    );

    if (!user.register) {
      const userData = await this.userService.getUserByUserName(
        user.phoneNumber,
      );
      if (!userData) {
        throw new NotFoundException('user.userNotFound');
      }
      user.firstName = userData.first_name;
      user.lastName = userData.last_name;
    }

    const requestCount = await this.redisService.getRequestCount(
      user.phoneNumber,
    );
    if (requestCount && Number(requestCount) >= maxOTPRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.OK,
          message: 'auth.otp.limit',
          data: {
            redirect: true,
          },
        },
        HttpStatus.OK,
      );
    }

    try {
      const otp = randomInt(100000, 1000000).toString();
      const message = this.i18n.t('auth.otp.sendSMS', {
        args: {
          firstName: user.firstName,
          lastName: user.lastName,
          otp: otp,
        },
      });

      const res = await firstValueFrom(
        this.authClient.send(
          'sendTextMessage',
          JSON.stringify({
            message,
            recipient: user.phoneNumber,
          }),
        ),
      );
      if (res.acknowledged) {
        await this.redisService.saveOTP(
          user.phoneNumber,
          otp,
          otpExpirationTime,
          rateLimitTime,
        );
        return {
          status: Status.Ok,
          message: this.i18n.t('auth.otp.sentSuccessful'),
        };
      }
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.OK,
          message: this.i18n.t('auth.otp.sendFailed'),
          data: {
            redirect: true,
          },
        },
        HttpStatus.OK,
      );
    }
  }

  async logout(req: Request) {
    if (req.cookies && req.cookies.refresh_token) {
      const refreshTokenCookie = req.cookies['refresh_token'];
      const verifiedRefresh = await this.jwtService.verifyAsync(
        refreshTokenCookie,
        {
          secret: this.refreshTokenSecret,
        },
      );
      await this.redisService.removeRefreshToken(
        verifiedRefresh.id,
        verifiedRefresh.jwtid,
      );
    }
    req.res.clearCookie('access_token');
    req.res.clearCookie('refresh_token');
  }
}
