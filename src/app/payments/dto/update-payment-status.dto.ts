import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.COMPLETED })
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ApiPropertyOptional({ description: 'Respuesta del gateway de pago en JSON' })
  @IsOptional()
  gatewayResponse?: Record<string, unknown>;
}
