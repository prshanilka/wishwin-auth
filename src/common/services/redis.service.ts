import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisRepository } from '../repository/redis.repository';

// const oneDayInSeconds = 60 * 60 * 24;
// const tenMinutesInSeconds = 60 * 10;

@Injectable()
export class RedisService {
  constructor(
    @Inject(RedisRepository) private readonly redisRepository: RedisRepository,
    private readonly configService: ConfigService,
  ) {}

  async saveRefreshToken(
    userId: string,
    jwtid: string,
    refreshTokenExp: number,
  ): Promise<void> {
    const redisClient = this.redisRepository.getClient();

    const pipeline = redisClient.pipeline();
    const currentTokenId = await redisClient.get(
      `current-refresh-token:${userId}`,
    );

    if (currentTokenId) {
      pipeline.del(`refresh-token:${userId}:${currentTokenId}`);
    }

    pipeline.set(
      `refresh-token:${userId}:${jwtid}`,
      userId,
      'EX',
      refreshTokenExp,
    );

    pipeline.set(
      `current-refresh-token:${userId}`,
      jwtid,
      'EX',
      refreshTokenExp,
    );
    await pipeline.exec();
  }

  async removeRefreshToken(userId: string, jwtid: string): Promise<void> {
    await this.redisRepository.delete('refresh-token', `${userId}:${jwtid}`);
  }

  async saveOTP(
    phoneNumber: string,
    otp: string,
    otpExpirationTime: number,
    rateLimitTime: number,
  ): Promise<void> {
    await this.redisRepository.setWithExpiry(
      'otp',
      phoneNumber,
      otp,
      otpExpirationTime,
    );
    // Increment the request counter with expiration
    await this.redisRepository.incr('otp:requests', phoneNumber);
    await this.redisRepository.expire(
      'otp:requests',
      phoneNumber,
      rateLimitTime,
    );
  }
  async getRequestCount(phoneNumber: string): Promise<string> {
    return this.redisRepository.get('otp:requests', phoneNumber);
  }
  async verifyOTP(phoneNumber: string, otp: number): Promise<boolean> {
    const storedOtp = await this.redisRepository.get('otp', phoneNumber);
    if (storedOtp === otp.toString()) {
      await this.redisRepository.delete('otp', phoneNumber);
      return true;
    }

    return false;
  }
}
