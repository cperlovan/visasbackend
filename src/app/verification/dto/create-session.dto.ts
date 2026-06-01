import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'ID de la solicitud de visa a la que pertenece esta sesión',
    example: 'uuid-de-la-solicitud',
  })
  @IsUUID()
  visaApplicationId: string;
}
