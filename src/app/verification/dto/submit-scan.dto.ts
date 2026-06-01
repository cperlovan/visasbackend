import { IsString, IsNotEmpty, IsBase64, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitScanDto {
  @ApiProperty({
    description: 'Token de sesión único generado por el QR',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @ApiProperty({
    description: 'Imagen de la zona MRZ del pasaporte en Base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgAB...',
  })
  @IsString()
  @IsNotEmpty()
  mrzImageBase64: string;

  @ApiProperty({
    description: 'Selfie del usuario en Base64',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgAB...',
  })
  @IsString()
  @IsNotEmpty()
  selfieImageBase64: string;
}
