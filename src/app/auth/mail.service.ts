import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(email: string, token: string) {
    // Apuntamos directamente al backend para pruebas
    const apiUrl = process.env.API_URL || 'localhost:3001';
    const url = `http://${apiUrl}/api/v1/auth/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verifica tu correo - Cancillería Digital',
      html: `
        <h1>Bienvenido a la Cancillería Digital</h1>
        <p>Para completar tu registro, por favor verifica tu correo haciendo clic en el siguiente enlace:</p>
        <a href="${url}">Verificar mi cuenta</a>
        <p>Si no puedes hacer clic, copia y pega este token en Swagger:</p>
        <code>${token}</code>
      `,
    });
  }

  async sendStatusUpdateEmail(email: string, firstName: string, applicationCode: string, newStatus: ApplicationStatus, observations?: string) {
    const statusMessages: Record<ApplicationStatus, string> = {
      [ApplicationStatus.DRAFT]: 'en fase de borrador',
      [ApplicationStatus.PENDING_FORM_FILL]: 'pendiente por completar formulario',
      [ApplicationStatus.VALIDATION]: 'en proceso de revisión por nuestros analistas',
      [ApplicationStatus.CORRECTION]: 'con requerimientos de subsanación (revisar observaciones)',
      [ApplicationStatus.PENDING_COORDINATOR_REVIEW]: 'en revisión de coordinación',
      [ApplicationStatus.PENDING_LINE_MANAGER_REVIEW]: 'en revisión gerencial',
      [ApplicationStatus.PENDING_DIRECTOR_GENERAL_REVIEW]: 'en firma autorizada',
      [ApplicationStatus.APPROVED]: 'APROBADA',
      [ApplicationStatus.REJECTED]: 'RECHAZADA',
    };

    const statusText = statusMessages[newStatus] || newStatus;
    const isFinalStatus = newStatus === ApplicationStatus.APPROVED || newStatus === ApplicationStatus.REJECTED;

    await this.mailerService.sendMail({
      to: email,
      subject: `Actualización de estatus: Solicitud ${applicationCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hola, ${firstName}</h2>
          <p>Te informamos que tu solicitud de visa con código <strong>${applicationCode}</strong> ha cambiado su estado a:</p>
          <div style="padding: 15px; background-color: #f4f4f4; border-radius: 5px; text-align: center; font-weight: bold; color: ${isFinalStatus ? '#0056b3' : '#333'};">
            ${statusText.toUpperCase()}
          </div>
          ${observations ? `
            <div style="margin-top: 20px;">
              <strong>Observaciones del funcionario:</strong>
              <p style="color: #666; border-left: 4px solid #ccc; padding-left: 10px;">${observations}</p>
            </div>
          ` : ''}
          <p style="margin-top: 30px;">Puedes consultar el detalle completo ingresando a la plataforma con tu cuenta.</p>
          <hr />
          <small style="color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</small>
        </div>
      `,
    });
  }
}
