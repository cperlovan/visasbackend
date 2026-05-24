import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Hace que PrismaService esté disponible en toda la aplicación
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

