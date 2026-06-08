import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { join } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // --- HABILITAR CORS ---
  // Se cambia 'origin' a 'true' para permitir cualquier origen durante las pruebas locales.
  // Esto evita el error "NetworkError" cuando la página test-websocket.html (un archivo local)
  // intenta hacer una llamada POST al servidor.
  app.enableCors({
    origin: true, // <-- ESTE ES EL CAMBIO
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- HABILITAR WEBSOCKETS (Socket.IO) ---
  app.useWebSocketAdapter(new IoAdapter(app));

  // Configuración de validación global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Archivos estáticos (selfies, documentos, etc.)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const config = new DocumentBuilder()
    .setTitle('Cancillería Digital API')
    .setDescription('Core API para trámites de visas y gestión consular')
    .setVersion('1.0')
    .addTag('visas')
    .addTag('verification')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📖 Swagger docs: http://localhost:${port}/docs`);
  Logger.log(`🔌 WebSocket en: ws://localhost:${port}/verification`);
}

bootstrap();