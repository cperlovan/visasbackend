import { Module } from '@nestjs/common';
import { VisasService } from './visas.service';
import { VisasController } from './visas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { DocumentsModule } from '../documents/documents.module';
import { AuthModule } from '../auth/auth.module';
// Asegúrate de que apunte al módulo en la raíz de app
import { VisaTypeModule } from '../visaType/visa-type.module'; 

@Module({
  imports: [PrismaModule, PaymentsModule, DocumentsModule, AuthModule, VisaTypeModule],
  controllers: [VisasController],
  providers: [VisasService],
})
export class VisasModule {}