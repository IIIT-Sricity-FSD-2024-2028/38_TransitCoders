import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security: Helmet sets standard HTTP security headers ──────────────────
  // X-Frame-Options, X-Content-Type-Options, X-DNS-Prefetch-Control, etc.
  app.use((helmet as any).default ? (helmet as any).default() : (helmet as any)());

  // ── CORS — allow only the frontend origin in dev ──────────────────────────
  app.enableCors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
  });

  // ── Global validation pipe — validates all DTOs automatically ─────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,           // Auto-cast primitives (@IsInt works correctly)
    }),
  );

  // ── Global exception filter — catches ALL errors, writes to disk ──────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger — browse the full API at /api/docs ────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('SwiftTrack Backend API')
    .setDescription('NestJS backend for the SwiftTrack logistics platform')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-auth-token', in: 'header' }, 'x-auth-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Save swagger.json to docs/ for team reference
  try {
    const docsDir = join(process.cwd(), 'docs');
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(
      join(docsDir, 'swagger.json'),
      JSON.stringify(document, null, 2)
    );
    console.log('📄 swagger.json saved to docs/swagger.json');
  } catch (e) {
    console.warn('Could not save swagger.json:', (e as Error).message);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 SwiftTrack API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`📁 Logs directory: ${join(process.cwd(), 'logs')}`);
}
bootstrap();
