import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AccountStatus } from '@prisma/client';
import { IAuthPayload } from 'src/modules/auth/interfaces/auth.interface';

import { ACCOUNT_KEY } from '../decorators/verified.decorator';

@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const accountStatus = this.reflector.get<AccountStatus>(
      ACCOUNT_KEY,
      context.getHandler(),
    );

    if (!accountStatus) {
      return true;
    }

    const { user }: { user: IAuthPayload } = context
      .switchToHttp()
      .getRequest();

    if (
      accountStatus !== user.accountStatus &&
      user.accountStatus === AccountStatus.Verified
    ) {
      throw new HttpException(
        {
          statusCode: 200,
          message: 'auth.accountStatusAlreadyVerified',
        },
        HttpStatus.OK,
      );
    }

    if (
      accountStatus !== user.accountStatus &&
      user.accountStatus !== AccountStatus.Verified
    ) {
      throw new HttpException(
        {
          statusCode: 403,
          message: 'auth.accountStatusNotVerified',
          data: {
            redirect: true,
          },
        },
        HttpStatus.OK,
      );
    }

    return user && accountStatus === user.accountStatus;
  }
}
