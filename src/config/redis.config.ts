import { registerAs } from '@nestjs/config';

export default registerAs(
  'redis',
  (): Record<string, unknown> => ({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  }),
);
