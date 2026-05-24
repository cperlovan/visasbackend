import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as ldap from 'ldapjs';
import { RegisterDto } from './dto/auth.dto';
import * as crypto from 'crypto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUserFromLdap(ldapUser: any, providerName: string = 'LDAP_CITIZEN', role: UserRole = UserRole.CITIZEN): Promise<any> {
    // LDAP suele devolver atributos como arrays. Extraemos el primer elemento.
    const rawEmail = ldapUser.mail || ldapUser.userPrincipalName;
    const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
    
    if (!email) {
      throw new BadRequestException('El servidor LDAP no retornó un correo válido.');
    }
    
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Sincronización: Si no existe en la DB local pero sí en LDAP, lo creamos
    if (!user) {
      console.log(`[LDAP Sync] Creando nuevo usuario local para: ${email} con rol ${role}`);
      user = await this.prisma.user.create({
        data: {
          email: email,
          firstName: ldapUser.givenName || '',
          lastName: ldapUser.sn || '',
          role: role,
          isActive: true,
          emailVerified: providerName === 'LDAP_INTERNAL', // Auto-verificar si es personal institucional
          password: 'LDAP_USER', // Password dummy ya que se valida en LDAP
          provider: { connect: { name: providerName } },
        },
      });
    }
    return user;
  }

  async login(user: any) {
    if (!user.emailVerified) {
      console.warn(`[Login] Intento de acceso bloqueado: El usuario ${user.email} no ha verificado su correo.`);
      throw new BadRequestException('Su correo electrónico aún no ha sido verificado.');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(dto: RegisterDto) {
    const { email, firstName, lastName, password } = dto;

    // 1. Verificar si ya existe en la DB local
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El usuario ya está registrado en el sistema.');
    }

    // 2. Crear el usuario en LDAP
    await this.createUserInLdap(dto);

    // 3. Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Sincronizar con la DB local (con estado no verificado)
    // Reutilizamos la lógica de sincronización pero con los datos del DTO
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: UserRole.CITIZEN,
        isActive: true,
        password: 'LDAP_USER', // La contraseña real vive en LDAP
        verificationToken,
        emailVerified: false,
        provider: { connect: { name: 'LDAP_CITIZEN' } },
      },
    });

    // 5. Enviar el correo de verificación
    await this.mailService.sendVerificationEmail(email, verificationToken);
    console.log(`Token de verificación para ${email}: ${verificationToken}`);

    return { message: 'Usuario registrado. Por favor verifique su correo para activar su cuenta.' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({ // findUnique es correcto si verificationToken es @unique
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de verificación inválido o expirado.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null, // Limpiamos el token una vez usado
      },
    });

    return { message: 'Correo electrónico verificado exitosamente. Ya puede gestionar sus trámites.' };
  }

  private async createUserInLdap(dto: RegisterDto): Promise<void> {
    const ldapUrl = process.env.LDAP_URL_CITIZEN || 'ldap://localhost:389';
    const client = ldap.createClient({
      url: ldapUrl,
    });

    return new Promise((resolve, reject) => {
      // Bind como administrador para poder escribir
      // Corregimos para usar la variable específica del .env
      const bindDn = process.env.LDAP_BIND_DN_CITIZEN || 'cn=admin,dc=ciudadanos,dc=org';
      const bindPass = process.env.LDAP_BIND_PASSWORD || 'admin';

      client.bind(bindDn, bindPass, (err) => {
        if (err) {
          console.error('Error de BIND en LDAP (Admin):', err);
          client.unbind();
          return reject(new InternalServerErrorException('Error de conexión con el servicio de identidad.'));
        }

        // Definir el Distinguished Name (DN) del nuevo usuario
        // Registramos directamente en la raíz configurada (ej: dc=example,dc=org) para evitar errores de ruta no encontrada
        const dn = `cn=${dto.email},${process.env.LDAP_BASE_DN_CITIZEN}`;
        const entry = {
          cn: dto.email,
          sn: dto.lastName,
          givenName: dto.firstName,
          mail: dto.email,
          userPassword: dto.password,
          objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
        };

        client.add(dn, entry, (addErr) => {
          client.unbind();
          if (addErr) {
            // Imprimimos el error en la consola del servidor para depurar
            console.error('Error detallado de LDAP:', addErr);

            if (addErr.name === 'EntryAlreadyExistsError') {
              return reject(new BadRequestException('El correo ya existe en el directorio corporativo.'));
            }
            if (addErr.name === 'NoSuchObjectError') {
              return reject(new BadRequestException(`No se encontró la ruta ${dn}. Asegúrese de que la OU 'ou=users' exista en su LDAP.`));
            }
            return reject(new InternalServerErrorException(`Error en el directorio: ${addErr.message}`));
          }
          resolve();
        });
      });
    });
  }
}