import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy = require('passport-ldapauth');
import { AuthService } from '../auth.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class LdapCitizenStrategy extends PassportStrategy(Strategy, 'ldap-citizen') {
  constructor(private authService: AuthService) {
    super({
      server: {
        url: process.env.LDAP_URL_CITIZEN,
        bindDN: process.env.LDAP_BIND_DN_CITIZEN,
        bindCredentials: process.env.LDAP_BIND_PASSWORD,
        searchBase: process.env.LDAP_BASE_DN_CITIZEN,
        searchFilter: '(mail={{username}})',
      },
    });
  }

  async validate(user: any) {
    console.log(`[Passport] Intento de login Ciudadano: ${user.mail || user.cn}`);
    return this.authService.validateUserFromLdap(user, 'LDAP_CITIZEN', UserRole.CITIZEN);
  }
}