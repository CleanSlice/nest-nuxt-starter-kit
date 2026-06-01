// Build-time placeholders so DI doesn't crash (JwtStrategy, PrismaClient)
// while we only need the OpenAPI document. Never used at runtime.
process.env.JWT_SECRET ||= '__swagger_build_placeholder__';
process.env.DATABASE_URL ||= 'postgresql://stub:stub@localhost:5432/stub';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  const config = new DocumentBuilder()
    .setTitle('CleanSlice Starter API')
    .setDescription('NestJS API built with CleanSlice architecture')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));

  await app.close();
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Swagger generation failed:', err);
    process.exit(1);
  });
