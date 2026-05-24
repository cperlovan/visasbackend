import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentStatus, Prisma, ApplicationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { BancamigaService } from './gateways/bancamiga.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private bancamiga: BancamigaService
  ) {}

  async create(dto: CreatePaymentDto, auditData?: any) {
    // Adaptamos para manejar uno o varios IDs de visa
    const visaIds = Array.isArray((dto as any).visaApplicationIds) 
      ? (dto as any).visaApplicationIds 
      : [dto.visaApplicationId];

    // 0. Verificar que las solicitudes existan
    const visas = await this.prisma.visaApplication.findMany({
      where: { id: { in: visaIds } },
    });

    if (visas.length === 0) {
      throw new BadRequestException(`No se encontraron solicitudes de visa válidas`);
    }

    // Asegurarse de que transactionId sea único. Si no se proporciona, generar uno.
    // Extraemos visaApplicationIds para que no entre en el spread de 'data' de Prisma
    const { transactionId, visaApplicationId, visaApplicationIds, ...paymentData } = dto as any;
    const finalTransactionId = transactionId || uuidv4();

    // 1. Registrar intención de pago localmente
    let payment;
    try {
      payment = await this.prisma.payment.create({
        data: {
          ...paymentData,
          status: PaymentStatus.PENDING,
          auditData: (auditData as Prisma.InputJsonValue) || {},
          transactionId: finalTransactionId,
          // Vinculamos todas las visas a este pago mediante la relación
          visaApplications: {
            connect: visaIds.map(id => ({ id }))
          }
        }
      });
    } catch (error) {
      const err = error as any;
      if (err.code === 'P2002') {
        throw new ConflictException(`La referencia de transacción ${finalTransactionId} ya existe`);
      }
      throw error;
    }

    // 2. Solicitar orden a Bancamiga (mapeo de campos según su documentación)
    if (!visas || visas.length === 0) {
      throw new BadRequestException('No se puede procesar un pago sin solicitudes de visa válidas.');
    }

    const mainVisa = visas[0];
    const order = await this.bancamiga.createOrder({
      monto: dto.amount.toString(),
      descripcion: `Pago de aranceles para ${visas.length} trámite(s)`,
      externalId: payment.id,
      dni: mainVisa.passportNumber || 'SIN-DNI', 
      nombre: `${mainVisa.firstName} ${mainVisa.lastName}`.trim() || 'Usuario Solicitante', 
      referencia: payment.id.substring(0, 8)
    });

    // Validar respuesta del banco para evitar errores de acceso a propiedades indefinidas
    if (!order || !order.data || !order.data.ordenID) {
      throw new InternalServerErrorException('Error en la respuesta de la pasarela de pagos');
    }

    // 3. Actualizar con el ordenID del banco
    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayToken: order.data.ordenID,
        paymentUrl: order.data.url
      }
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findByApplication(visaApplicationId: string) {
    // Como el pago ya no tiene visaApplicationId, buscamos a través de la relación
    return this.prisma.payment.findMany({
      where: {
        visaApplications: { some: { id: visaApplicationId } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);
    return payment;
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto) {
    await this.findOne(id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async verifyPayment(id: string) {
    let payment = await this.findOne(id);
    
    if (!payment.gatewayToken) {
      throw new BadRequestException('El pago no posee un token de seguimiento (gatewayToken)');
    }

    this.logger.debug(`Consultando estatus en Bancamiga para Token: ${payment.gatewayToken}`);

    // Consultar el estatus real en Bancamiga
    const bankResponse = await this.bancamiga.checkStatus(payment.gatewayToken);
    
    this.logger.log(`Respuesta de Bancamiga para pago ${id}: ${JSON.stringify(bankResponse)}`);

    if (bankResponse?.data?.Status) {
      // Limpieza profunda del string de estatus
      const bankStatus = bankResponse.data.Status.toString().toLowerCase().trim(); 
      let newStatus: PaymentStatus | null = null;

      if (bankStatus === 'approved' && payment.status !== PaymentStatus.COMPLETED) {
        newStatus = PaymentStatus.COMPLETED;
      } else if (['rejected', 'failed'].includes(bankStatus) && payment.status !== PaymentStatus.FAILED) {
        newStatus = PaymentStatus.FAILED;
      }

      if (newStatus) {
        payment = await this.prisma.payment.update({
          where: { id },
          data: { status: newStatus }
        });

        // Si el pago es exitoso, actualizamos automáticamente la solicitud de visa vinculada
        if (newStatus === PaymentStatus.COMPLETED) {
          // Actualizamos TODAS las visas que tengan este paymentId
          await this.prisma.visaApplication.updateMany({
            where: { paymentId: id },
            data: { 
              status: ApplicationStatus.PENDING_FORM_FILL, 
              observations: 'Pago confirmado vía Bancamiga. Por favor, complete el formulario extenso.' 
            }
          });
        }
      }
    } else {
      this.logger.warn(`El banco no devolvió un campo 'Status' válido para el pago ${id}`);
    }

    // Devolvemos el pago junto con la respuesta del banco para depuración
    return { ...payment, bankDetails: bankResponse?.data };
  }
}
