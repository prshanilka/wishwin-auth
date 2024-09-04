import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import cookieParser from 'cookie-parser';

import { AppModule } from './app/app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(express()),
    {
      cors: {
        origin: ['http://localhost:5173', 'http://example.com'], // specify your frontend domain
        credentials: true, // allow credentials if needed
      },
    },
  );

  const configService = app.get(ConfigService);
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 200,
      message: `Hello from ${configService.get('app.name')}`,
      data: {
        timestamp: new Date(),
      },
    });
  });

  const port: number = configService.get<number>('app.http.port');
  const host: string = configService.get<string>('app.http.host');
  const globalPrefix: string = configService.get<string>('app.globalPrefix');
  const versioningPrefix: string = configService.get<string>(
    'app.versioning.prefix',
  );
  const version: string = configService.get<string>('app.versioning.version');
  const versionEnable: string = configService.get<string>(
    'app.versioning.enable',
  );
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove properties that are not defined in the DTO
      forbidNonWhitelisted: true, // Throw an error if an extra property is sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.setGlobalPrefix(globalPrefix);
  if (versionEnable) {
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: version,
      prefix: versioningPrefix,
    });
  }
  setupSwagger(app);
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [`${configService.get('rmq.uri')}`],
      queue: `${configService.get('rmq.auth')}`,
      queueOptions: { durable: false },
      prefetchCount: 1,
    },
  });
  app.use(cookieParser());
  await app.startAllMicroservices();
  await app.listen(port, host);
  logger.log(
    `🚀 ${configService.get(
      'app.name',
    )} service started successfully on port ${port}`,
  );
}
bootstrap();
