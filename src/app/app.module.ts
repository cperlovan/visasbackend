import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <-- 1. IMPORTA el módulo
import { PrismaModule } from './prisma/prisma.module';
import { VisasModule } from './visas/visas.module';
import { DocumentsModule } from './documents/documents.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { ReviewModule } from './review/review.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module'; 


@Module({
  imports: [
    // <-- 2. AÑADE el módulo a la lista, es mejor ponerlo primero.
    ConfigModule.forRoot({
      isGlobal: true, // Esto hace que no necesites importarlo en otros módulos
    }),
    PrismaModule,
    VisasModule,
    DocumentsModule,
    PaymentsModule,
    UsersModule,
    ReviewModule,
    AuthModule,
    AppointmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}