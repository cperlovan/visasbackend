import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({ // <-- Cambiado a Opcional
    description: 'ID de la solicitud de visa (si ya existe)',
    example: 'clwsecq4100007gn4505p7d7c',
  })
  @IsOptional() // <-- Añadido para que el validador lo permita
  @IsUUID()
  visaApplicationId?: string; // <-- Añadido '?' para hacerlo opcional en TypeScript

  @ApiProperty({
    description: 'ID del usuario que inicia la sesión',
    example: 'clwsebxj300007gn412345678',
  })
  @IsString()
  userId: string;
}