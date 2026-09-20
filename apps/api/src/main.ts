/**
 * NestJS API entrypoint.
 *
 * Per spec §16.1: "Vercel không giữ khóa database hoặc provider AI trong client bundle."
 * Per spec §23.5: Health endpoint does NOT expose version secrets, DB URL, or provider status.
 *
 * Secrets are loaded from environment only — never from code.
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const port = process.env['PORT'] ?? '3001';

  const app = await NestFactory.create(AppModule, {
    // Do not log request bodies (may contain sensitive data)
    logger: ['error', 'warn', 'log'],
  });

  // API versioning prefix — all routes under /v1
  app.setGlobalPrefix('v1');

  await app.listen(Number(port));
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
}

void bootstrap();
