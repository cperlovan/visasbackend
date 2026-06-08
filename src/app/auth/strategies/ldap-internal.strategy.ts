import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy = require('passport-ldapauth');
import { AuthService } from '../auth.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class LdapInternalStrategy extends PassportStrategy(Strategy, 'ldap-internal') {
  constructor(private authService: AuthService) {
    super({
      server: {
        url: process.env.LDAP_URL_INTERNAL,
        bindDN: process.env.LDAP_BIND_DN_INTERNAL,
        bindCredentials: process.env.LDAP_BIND_PASSWORD,
        searchBase: process.env.LDAP_BASE_DN_INTERNAL,
        searchFilter: '(mail={{username}})',
      },
    });
  }

  async validate(user: any) {
    // Aquí podrías lógica adicional para asignar OFFICER, COORDINATOR, etc. basado en grupos LDAP
    console.log(`[Passport] Intento de login Oficina: ${user.mail || user.cn}`);
    return this.authService.validateUserFromLdap(user, 'LDAP_INTERNAL', UserRole.OFFICER);
  }
}