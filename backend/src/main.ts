import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Garante que a pasta de uploads existe
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Serve arquivos estáticos da pasta uploads (avatares, capas de curso)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Aumenta limite de payload para suportar uploads de mídia em base64 (até ~6MB)
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ limit: '8mb', extended: true }));

  // Ativa CORS para permitir chamadas do frontend SPA (Vite)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Universidade Suri API')
    .setDescription('A API oficial da plataforma Universidade Suri. Permite gerenciar perfis, cursos, aulas e certificados.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API da Universidade Suri rodando na porta: http://localhost:${port}`);
  logger.log(`Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
}
bootstrap();
