
// Se ha eliminado la importación de @nestjs/swagger
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { MaritalStatus } from '@prisma/client';

export class CompleteVisaFormDto {
  // @ApiProperty ha sido eliminado
  @IsEnum(MaritalStatus)
  maritalStatus!: MaritalStatus;

  // @ApiProperty ha sido eliminado
  @IsString()
  @IsNotEmpty()
  birthPlace!: string;

  // @ApiProperty ha sido eliminado
  @IsString()
  passportType!: string;

  // @ApiProperty ha sido eliminado
  @IsDateString()
  passportIssueDate!: string;

  // @ApiPropertyOptional ha sido eliminado
  @IsOptional()
  @IsString()
  profession?: string;

  // @ApiPropertyOptional ha sido eliminado
  @IsOptional()
  @IsString()
  currentEmployer?: string;

  // @ApiProperty ha sido eliminado
  @IsString()
  @IsNotEmpty()
  purposeOfTrip!: string;

  // @ApiProperty ha sido eliminado
  @IsDateString()
  arrivalDate!: string;

  // @ApiProperty ha sido eliminado
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  stayDuration!: number;

  // @ApiPropertyOptional ha sido eliminado
  @IsOptional()
  @IsString()
  officePhone?: string;

  // @ApiProperty ha sido eliminado
  @IsString()
  emergencyContact!: string;

  // @ApiProperty ha sido eliminado
  @IsString()
  economicResponsible!: string;
}
