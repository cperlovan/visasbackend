import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import LdapauthStrategy = require('passport-ldapauth');
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class LdapStrategy extends PassportStrategy(LdapauthStrategy, 'ldap') {
  constructor(private authService: AuthService) {
    super({
      server: {
        url: process.env.LDAP_URL || 'ldap://localhost:389',
        bindDN: process.env.LDAP_BIND_DN, // Opcional si el bind es directo
        bindCredentials: process.env.LDAP_BIND_PASSWORD,
        searchBase: process.env.LDAP_BASE_DN || 'dc=example,dc=org',
        searchFilter: '(mail={{username}})', // Buscamos por el campo email enviado en el body
        searchAttributes: ['displayName', 'mail', 'givenName', 'sn'],
      },
    });
  }

  async validate(user: any): Promise<any> {
    const validatedUser = await this.authService.validateUserFromLdap(user);
    
    // Log de depuración para verificar el estado en la base de datos
    console.log(`Intento de login: ${validatedUser.email} | Verificado: ${validatedUser.emailVerified}`);

    if (!validatedUser) {
      throw new UnauthorizedException('El usuario no existe en el sistema local.');
    }
    if (!validatedUser.isActive) {
      throw new UnauthorizedException('Su cuenta se encuentra inactiva. Contacte al administrador.');
    }
    if (validatedUser.emailVerified === false) {
      throw new UnauthorizedException('Debe verificar su correo electrónico antes de poder ingresar.');
    }

    return validatedUser;
  }

  // Passport-ldapauth espera los campos 'username' y 'password' por defecto
  authenticate(req: Request, options?: any) {
    super.authenticate(req, options);
  }
}