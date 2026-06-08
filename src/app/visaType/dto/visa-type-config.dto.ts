import { IsEnum, IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VisaType, DocumentType, UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VisaRequirementDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ default: true })
  @IsBoolean()
  isRequired!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class WorkflowStepDto {
  @ApiProperty({ description: 'Orden secuencial del paso (1, 2, 3...)' })
  @IsNumber()
  stepOrder!: number;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  roleRequired!: UserRole;

  @ApiProperty({ default: false })
  @IsBoolean()
  isOptional!: boolean;
}

export class CreateVisaTypeConfigDto {
  @ApiProperty({ enum: VisaType })
  @IsEnum(VisaType)
  visaType!: VisaType;

  @ApiProperty({ example: 'Visa de Turismo Tradicional' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 60.0 })
  @IsNumber()
  arancelAmount!: number;

  @ApiProperty({ type: [VisaRequirementDto] })
  @ValidateNested({ each: true })
  @Type(() => VisaRequirementDto)
  requirements!: VisaRequirementDto[];

  @ApiProperty({ type: [WorkflowStepDto] })
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  workflowSteps!: WorkflowStepDto[];
}