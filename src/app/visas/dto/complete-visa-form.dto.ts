import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { MaritalStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteVisaFormDto {
  @ApiProperty({ enum: MaritalStatus })
  @IsEnum(MaritalStatus)
  maritalStatus!: MaritalStatus;

  @ApiProperty({ example: 'Caracas' })
  @IsString()
  @IsNotEmpty()
  birthPlace!: string;

  @ApiProperty({ example: 'ORDINARIO' })
  @IsString()
  passportType!: string;

  @ApiProperty({ example: '2020-05-15' })
  @IsDateString()
  passportIssueDate!: string;

  @ApiPropertyOptional({ example: 'Ingeniero' })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ example: 'Empresa S.A.' })
  @IsOptional()
  @IsString()
  currentEmployer?: string;

  @ApiProperty({ example: 'Turismo' })
  @IsString()
  @IsNotEmpty()
  purposeOfTrip!: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  arrivalDate!: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  stayDuration!: number;

  @ApiPropertyOptional({ example: '+584120000000' })
  @IsOptional()
  @IsString()
  officePhone?: string;

  @ApiProperty({ example: 'Familiar en destino' })
  @IsString()
  emergencyContact!: string;

  @ApiProperty({ example: 'Propio' })
  @IsString()
  economicResponsible!: string;
}