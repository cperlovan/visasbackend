import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, VisaType } from '@prisma/client';

export class UpdateVisaDto {
  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ example: 'AB123456' })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({ enum: VisaType, example: VisaType.TURISTA })
  @IsOptional()
  @IsEnum(VisaType)
  visaType?: VisaType;

  @ApiPropertyOptional({ example: 'Colombiana' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'MASCULINO' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'SOLTERO' })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional({ example: 'Ingeniero de Software' })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ example: 'Tech Corp S.A.' })
  @IsOptional()
  @IsString()
  currentEmployer?: string;

  @ApiPropertyOptional({ example: '+57 1 234 5678' })
  @IsOptional()
  @IsString()
  officePhone?: string;

  @ApiPropertyOptional({ example: 'Turismo' })
  @IsOptional()
  @IsString()
  purposeOfTrip?: string;

  @ApiPropertyOptional({ example: 'juan.perez@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  stayDuration?: number;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;
}
