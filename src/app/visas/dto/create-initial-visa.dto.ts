import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsDateString, IsEmail } from 'class-validator';
import { VisaType, Gender, ApplicationStatus } from '@prisma/client';

export class CreateInitialVisaDto {
  @ApiProperty({ enum: VisaType, example: VisaType.TURISTA, description: 'Categoría oficial MPPRE' })
  @IsEnum(VisaType)
  visaType!: VisaType;

  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.DRAFT, description: 'Estado inicial' })
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus = ApplicationStatus.DRAFT;

  @ApiProperty({ example: 'VIS-2026-001', description: 'Código único de la aplicación' })
  @IsString()
  @IsNotEmpty()
  applicationCode!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Venezolana' })
  @IsString()
  @IsNotEmpty()
  nationality!: string;

  @ApiProperty({ example: 'ABC123456' })
  @IsString()
  @IsNotEmpty()
  passportNumber!: string;

  @ApiProperty({ example: '1990-05-15', format: 'YYYY-MM-DD' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: '2030-05-15', description: 'Vencimiento del pasaporte (OCR)' })
  @IsDateString()
  passportExpiryDate!: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender!: Gender;
}