import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.PASSPORT })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiProperty({ example: 'https://storage.example.com/pasaport.pdf' })
  @IsNotEmpty()
  @IsString()
  url!: string;

  @ApiProperty({ example: 'uuid-de-la-solicitud' })
  @IsNotEmpty()
  @IsString()
  visaApplicationId!: string;
}
