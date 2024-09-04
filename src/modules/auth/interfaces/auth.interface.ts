import { AccountStatus } from '@prisma/client';
import { Status } from 'src/enums/common';

export interface ITokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthPayload {
  id: string;
  role: string;
  accountStatus: AccountStatus;
  firstName: string;
  lastName: string;
  username: string;
}

export enum TokenType {
  ACCESS_TOKEN = 'AccessToken',
  REFRESH_TOKEN = 'RefreshToken',
}

export interface IAuthResponse {
  status: Status;
  message: string;
}
