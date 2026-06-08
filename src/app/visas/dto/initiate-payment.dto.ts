import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InitiatePaymentDto {
  @ApiProperty({ example: 50.00, description: 'Monto del pago' })
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ example: 'USD', description: 'Moneda del pago' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiPropertyOptional({ example: 'CREDIT_CARD', description: 'Medio de pago utilizado' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'REF-001', description: 'Referencia interna opcional' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}