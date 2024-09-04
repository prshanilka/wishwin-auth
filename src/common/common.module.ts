import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configs from '../config';
import { PrismaService } from './services/prisma.service';
import { HelperHashService } from './services/helper.hash.service';
import { redisClientFactory } from './factory/redis.client.factory';
import { RedisRepository } from './repository/redis.repository';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configs,
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),
  ],
  providers: [
    PrismaService,
    HelperHashService,
    redisClientFactory,
    RedisRepository,
    RedisService,
  ],
  exports: [PrismaService, HelperHashService, RedisService],
})
export class CommonModule {}
