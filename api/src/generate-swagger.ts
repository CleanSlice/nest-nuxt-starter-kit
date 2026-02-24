import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('CleanSlice Starter API')
    .setDescription('NestJS API built with CleanSlice architecture')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));

  await app.close();
  process.exit(0);
}

generate();
