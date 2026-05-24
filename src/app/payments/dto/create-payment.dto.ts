import { IsNotEmpty, IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 'TXN-2026-001', description: 'ID de transacción del gateway de pago' })
  @IsNotEmpty()
  @IsString()
  transactionId!: string;

  @ApiProperty({ example: 50.00, description: 'Monto en dólares' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ example: 'CREDIT_CARD', description: 'Método de pago' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: 'uuid-de-la-solicitud' })
  @IsNotEmpty()
  @IsString()
  visaApplicationId!: string;
}
