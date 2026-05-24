import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class UpdateVisaStatusDto {
  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.PENDING_COORDINATOR_REVIEW, description: 'Nuevo estado de la solicitud' })
  @IsNotEmpty()
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiProperty({ example: 'La foto del pasaporte es ilegible', description: 'Motivo de la subsanación o notas de revisión', required: false })
  @IsOptional()
  @IsString()
  observations?: string;
}
