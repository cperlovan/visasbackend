import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, Req, Query, Res, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentAuditInterceptor } from './gateways/payment-audit.interceptor';
import { Response } from 'express';

@ApiTags('payments')
@Controller('payment-button')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseInterceptors(PaymentAuditInterceptor)
  @ApiOperation({ summary: 'Crear intención de pago e iniciar orden en Bancamiga' })
  create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: any) {
    // Extraemos los datos capturados por el interceptor
    const auditData = req['paymentAudit'];
    return this.paymentsService.create(createPaymentDto, auditData);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los pagos' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('done')
  @ApiOperation({ summary: 'Callback de éxito: El banco redirige al usuario aquí' })
  async callbackDone(
    @Query('OrderID') orderId: string, 
    @Query('ExternalID') paymentId: string, 
    @Res() res: Response
  ) {
    this.logger.log(`Callback DONE procesado. Orden: ${orderId}, Pago Interno: ${paymentId}`);
    
    // Forzamos una verificación inmediata para que el usuario no tenga que esperar al poll del frontend
    await this.paymentsService.verifyPayment(paymentId);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/tramites/pago-confirmado?paymentId=${paymentId}&orderId=${orderId}`);
  }

  @Get('cancel')
  @ApiOperation({ summary: 'Callback de cancelación o falla' })
  async callbackCancel(
    @Query('OrderID') orderId: string, 
    @Query('ExternalID') paymentId: string, 
    @Res() res: Response
  ) {
    this.logger.warn(`Usuario regresó de Bancamiga (Cancelado). Orden: ${orderId}`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/tramites/pago-fallido?paymentId=${paymentId}`);
  }

  @Get(':id/verify')
  @ApiOperation({ summary: 'Verificación forzada de estatus con la pasarela' })
  verify(@Param('id') id: string) {
    return this.paymentsService.verifyPayment(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualización manual de estatus (Admin)' })
  updateStatus(@Param('id') id: string, @Body() updatePaymentStatusDto: UpdatePaymentStatusDto) {
    return this.paymentsService.updateStatus(id, updatePaymentStatusDto);
  }
}