import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { MailService } from './mail.service';
import { LdapCitizenStrategy } from './strategies/ldap-citizen.strategy';
import { LdapInternalStrategy } from './strategies/ldap-internal.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // --- CAMBIO CLAVE: REGISTRO ASÍNCRONO Y SEGURO DEL JWTMODULE ---
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          // Esto es crucial: la aplicación no se iniciará si el secreto falta.
          throw new Error(
            'FATAL ERROR: La variable de entorno JWT_SECRET no está definida.',
          );
        }
        return {
          secret: secret,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'localhost',
        port: Number(process.env.MAIL_PORT) || 1025,
        ignoreTLS: true,
        secure: false,
      },
      defaults: {
        from:
          process.env.MAIL_FROM ||
          '"Cancillería Digital" <no-reply@mppre.gob.ve>',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    LdapCitizenStrategy,
    LdapInternalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService, MailService],
})
export class AuthModule {}