import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Correo electrónico del usuario registrado en LDAP' })
  @IsNotEmpty({ message: 'El nombre de usuario o correo es requerido' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña del usuario' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email!: string;

  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  firstName!: string;

  @ApiProperty({ example: 'Perez' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  lastName!: string;

  @ApiProperty({ example: 'Password123!', description: 'Mínimo 8 caracteres' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}