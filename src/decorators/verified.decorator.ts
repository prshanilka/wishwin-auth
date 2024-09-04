import { SetMetadata } from '@nestjs/common';
import { AccountStatus } from '@prisma/client';

export const ACCOUNT_KEY = 'account-status';
export const Verified = (accountStatus: AccountStatus) =>
  SetMetadata(ACCOUNT_KEY, accountStatus);
