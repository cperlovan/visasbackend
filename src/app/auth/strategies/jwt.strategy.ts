import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException, // <-- 1. Importar InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // 2. Eliminar el constructor original y reemplazarlo por este
  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;

    // 3. Añadir el chequeo de seguridad
    if (!jwtSecret) {
      // Usamos un logger temporal o directamente console.error si no hay logger aquí
      console.error('FATAL ERROR: La variable de entorno JWT_SECRET no está definida.');
      throw new InternalServerErrorException(
        'El sistema de autenticación no está configurado correctamente.',
      );
    }

    // 4. Configurar la estrategia SIN el valor de fallback
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // <-- Usar la variable segura
    });
  }

  async validate(payload: any) {
    // El payload del JWT de login tiene el id en la propiedad 'sub'
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido, falta el subject (sub).');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('El usuario perteneciente a este token ya no existe.');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta de usuario está inactiva.');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'La dirección de correo electrónico no ha sido verificada.',
      );
    }

    // El objeto que se retorna aquí se inyecta en el objeto Request de NestJS.
    // Así, en los controladores, podemos acceder a req.user.
    return { id: user.id, email: user.email, role: user.role };
  }
}