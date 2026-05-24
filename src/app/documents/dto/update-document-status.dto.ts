import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: DocumentStatus, enumName: 'DocumentStatus', example: 'APPROVED' })
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status!: DocumentStatus;

  @ApiPropertyOptional({ example: 'Documento ilegible, por favor resubir' })
  @IsOptional()
  @IsString()
  observations?: string;
}
