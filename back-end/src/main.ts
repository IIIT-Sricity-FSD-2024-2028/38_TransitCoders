import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — allow frontend to connect from any origin in dev
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
  });

  // Global validation pipe — validates all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,          // Auto-cast primitives (@IsInt works correctly)
    }),
  );

  // Global exception filter — formats all thrown exceptions into IApiResponse
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger — browse the full API at /api/docs
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
}
bootstrap();
