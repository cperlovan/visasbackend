import { IsString, IsNotEmpty, IsDateString, IsEnum, IsNumber, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus, VisaType, Gender, MaritalStatus } from '@prisma/client';

export class CreateVisaDto {
  @ApiProperty({ example: 'VIS-2026-001', description: 'Código único de la solicitud' })
  @IsNotEmpty()
  @IsString()
  applicationCode!: string;

  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.DRAFT, description: 'Estado de la solicitud' })
  @IsNotEmpty()
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiProperty({ example: 'Juan', description: 'Nombre del solicitante' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del solicitante' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ example: 'AB123456', description: 'Número de pasaporte' })
  @IsNotEmpty()
  @IsString()
  passportNumber!: string;

  @ApiProperty({ enum: VisaType, example: VisaType.TURISTA, description: 'Categoría oficial MPPRE' })
  @IsEnum(VisaType)
  visaType!: VisaType;

  @ApiProperty({ example: 'Colombiana', description: 'Nacionalidad del solicitante' })
  @IsNotEmpty()
  @IsString()
  nationality!: string;

  @ApiProperty({ example: '1990-05-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ enum: MaritalStatus, example: MaritalStatus.SINGLE })
  @IsNotEmpty()
  @IsEnum(MaritalStatus)
  maritalStatus!: MaritalStatus;

  @ApiProperty({ example: 'Ingeniero de Software', description: 'Profesión u ocupación' })
  @IsNotEmpty()
  @IsString()
  profession!: string;

  @ApiProperty({ example: 'Tech Corp S.A.', description: 'Empleador actual' })
  @IsNotEmpty()
  @IsString()
  currentEmployer!: string;

  @ApiProperty({ example: '+57 1 234 5678', description: 'Teléfono de la oficina' })
  @IsNotEmpty()
  @IsString()
  officePhone!: string;

  @ApiProperty({ example: 'Turismo', description: 'Propósito del viaje' })
  @IsNotEmpty()
  @IsString()
  purposeOfTrip!: string;

  @ApiProperty({ example: 'juan.perez@email.com', description: 'Correo electrónico del solicitante' })
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiProperty({ example: 30, description: 'Duración de la estadía en días' })
  @IsNotEmpty()
  @IsNumber()
  stayDuration!: number;

  @ApiProperty({ example: '2026-07-01', description: 'Fecha de llegada (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  arrivalDate!: string;
}
