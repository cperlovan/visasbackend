import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { VerificationGateway } from './verification.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      // Usa el mismo secret del sistema para no duplicar configuración
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '10m' },
    }),
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    VerificationGateway, // El Gateway debe estar en providers para que NestJS lo gestione
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
