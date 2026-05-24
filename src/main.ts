import 'reflect-metadata'; // ¡Esta línea debe ser la primera!
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // --- HABILITAR CORS ---
  // Le decimos al backend que confíe en las peticiones del frontend
  app.enableCors({
    origin: 'http://localhost:3000', // El origen de tu frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // ----------------------
  
  // Configuración de validación global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Configurar para servir archivos estáticos (para las selfies, etc.)
  // AJUSTE: La ruta 'apps/backend/...' era del monorepo. La he corregido a una ruta estándar.
  // Asegúrate de tener una carpeta 'uploads' en la raíz de 'e_visa_backend'.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const config = new DocumentBuilder()
    .setTitle('Cancillería Digital API')
    .setDescription('Core API para trámites de visas y gestión consular')
    .setVersion('1.0')
    .addTag('visas')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // AJUSTE: Cambiado el puerto por defecto a 3001 para evitar conflictos con el frontend (que usa 3000).
  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 API running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📖 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();