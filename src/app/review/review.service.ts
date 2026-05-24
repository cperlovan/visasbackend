import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus } from '@prisma/client';
import { UpdateVisaStatusDto } from '@cancilleria-digital/shared-dto';
import { MailService } from '../auth/mail.service';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async processReview(id: string, dto: UpdateVisaStatusDto) {
    const visa = await this.prisma.visaApplication.findUnique({ 
      where: { id },
      include: { user: true }
    });

    if (!visa) {
      throw new NotFoundException(`Expediente ${id} no encontrado`);
    }

    if (visa.status === ApplicationStatus.DRAFT) {
      throw new BadRequestException('No se puede procesar la revisión de un expediente en estado Borrador (DRAFT)');
    }

    if (visa.status === ApplicationStatus.PENDING_FORM_FILL) {
      throw new BadRequestException('El expediente aún no ha completado el formulario extenso y la carga de recaudos.');
    }

    if (dto.status === ApplicationStatus.CORRECTION && !dto.observations) {
      throw new BadRequestException('Debe especificar qué debe subsanar el ciudadano en el campo de observaciones');
    }

    const updatedVisa = await this.prisma.visaApplication.update({
      where: { id },
      data: {
        status: dto.status,
        observations: dto.observations || visa.observations, // Preservar si no se envía una nueva
      },
    });

    // Enviar notificación por correo
    try {
      console.log(`Intentando enviar correo para visa ${id} con estatus ${dto.status}`);
      if (visa.user) {
        console.log(`Usuario encontrado para notificación: ${visa.user.email}, Nombre: ${visa.user.firstName}`);
        await this.mailService.sendStatusUpdateEmail(
          visa.user.email,
          visa.user.firstName || 'Usuario',
          visa.applicationCode || id,
          dto.status,
          dto.observations
        );
        console.log(`Correo de estatus enviado exitosamente para ${visa.user.email}`);
      }
    } catch (mailError) {
      console.error('Error al enviar el correo desde ReviewService:', mailError);
    }

    return updatedVisa;
  }

  async getQueue(status: ApplicationStatus) {
    return this.prisma.visaApplication.findMany({
      where: { status },
      orderBy: { updatedAt: 'asc' },
    });
  }
}