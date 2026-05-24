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
import { JwtStrategy } from './strategies/jwt.strategy'; // Asumiendo que existe

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '1h' },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'localhost',
        port: Number(process.env.MAIL_PORT) || 1025,
        ignoreTLS: true,
        secure: false, // Mailpit no usa SSL/TLS por defecto
      },
      defaults: {
        from: process.env.MAIL_FROM || '"Cancillería Digital" <no-reply@mppre.gob.ve>',
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