import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { TransformMessagePayload } from 'src/decorators/payload.decorator';
import { AuthUser } from 'src/decorators/auth.decorator';
import { Request } from 'express';
// import { AllowedRoles } from 'src/decorators/role.decorator';
// import { Verified } from 'src/decorators/verified.decorator';
// import { AccountStatus, Roles } from '@prisma/client';
// import { VerifiedGuard } from 'src/guards/verified.guard';

import { AuthResponseDto } from '../dtos/auth.response.dto';
import { AuthJwtRefreshGuard } from '../../../guards/jwt.refresh.guard';
import { IAuthPayload, IAuthResponse } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import { AuthLoginDto, AuthOTPLoginDto } from '../dtos/auth.login.dto';
import { AuthSignupDto } from '../dtos/auth.signup.dto';
import { AuthOTPRequestDto } from '../dtos/auth.otp.request.dto';

@ApiTags('auth')
@Controller({
  version: '1',
  path: '/auth',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('validateToken')
  public async getUserByAccessToken(
    @TransformMessagePayload() payload: Record<string, string>,
  ) {
    return this.authService.verifyToken(payload.token);
  }

  @Public()
  @Post('login/email')
  public login(
    @Body() payload: AuthLoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.login(payload, req);
  }

  @Public()
  @Post('login/otp')
  public otpLogin(
    @Body() payload: AuthOTPLoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.OTPlogin(payload, req);
  }

  @Public()
  @Post('signup')
  public signup(@Body() payload: AuthSignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(payload);
  }

  @Public()
  @Post('otp/request')
  public otpRequest(
    @Body() payload: AuthOTPRequestDto,
  ): Promise<IAuthResponse> {
    return this.authService.sendOTP(payload);
  }

  @Public()
  @UseGuards(AuthJwtRefreshGuard)
  @Get('refresh-token')
  public refreshTokens(@AuthUser() user: IAuthPayload) {
    return this.authService.generateTokens(user);
  }

  @Delete('logout')
  async logout(@Req() req: Request) {
    return this.authService.logout(req);
  }
}
