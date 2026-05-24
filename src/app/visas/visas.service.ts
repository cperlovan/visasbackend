import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VisaType, Gender, MaritalStatus, ApplicationStatus, UserRole, DocumentType, VisaApplication, User, Document, DocumentStatus, FamilyRole } from '@prisma/client';
import { CreateVisaDto } from './dto/create-visa.dto';
import { CreateInitialVisaDto } from './dto/create-initial-visa.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { CompleteVisaFormDto } from './dto/complete-visa-form.dto';
import { ReviewApplicationDto, ReviewAction } from './dto/review-application.dto';
import { PaymentsService } from '../payments/payments.service';
import { DocumentsService } from '../documents/documents.service';
import { MailService } from '../auth/mail.service';
import { VisaTypeService } from '../visaType/visa-type.service';
import * as path from 'path';
import * as fs from 'fs/promises';

// Helper para definir el tipo de la aplicación con sus documentos a nivel de archivo
type ApplicationWithDocuments = VisaApplication & { documents: Document[] };

@Injectable()
export class VisasService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private documentsService: DocumentsService,
    private mailService: MailService,
    private visaTypeService: VisaTypeService,
  ) {}

  // =================================================================
  // === NUEVOS MÉTODOS PARA EL FLUJO DE REVISIÓN JERÁRQUICA ===
  // =================================================================

  /**
   * REQ 2: Obtiene la cola de trámites según el rol del usuario.
   */
  async getReviewQueue(user: User) {
    const statusMap: Partial<Record<UserRole, ApplicationStatus>> = {
      [UserRole.OFFICER]: ApplicationStatus.VALIDATION,
      [UserRole.COORDINATOR]: ApplicationStatus.PENDING_COORDINATOR_REVIEW,
      [UserRole.LINE_MANAGER]: ApplicationStatus.PENDING_LINE_MANAGER_REVIEW,
      [UserRole.DIRECTOR_GENERAL]: ApplicationStatus.PENDING_DIRECTOR_GENERAL_REVIEW,
    };

    const targetStatus = statusMap[user.role];
    if (!targetStatus) {
      return []; // Roles sin cola de revisión asignada (ej. ADMIN, CITIZEN)
    }

    return this.prisma.visaApplication.findMany({
      where: { 
        status: targetStatus,
      },
      orderBy: { createdAt: 'asc' },
      include: { user: true, documents: true }
    });
  }

  /**
   * REQ 1: Procesa la revisión de un trámite.
   */
  async reviewApplication(id: string, reviewDto: ReviewApplicationDto, user: User) {
    const application = await this.prisma.visaApplication.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found.`);
    }

    const { action } = reviewDto;
    let nextStatus: ApplicationStatus;

    switch (user.role) {
      case UserRole.OFFICER:
        this.ensureCorrectState(application, ApplicationStatus.VALIDATION);
        nextStatus = await this.handleOfficerReview(application as ApplicationWithDocuments, action);
        break;

      case UserRole.COORDINATOR:
        this.ensureCorrectState(application, ApplicationStatus.PENDING_COORDINATOR_REVIEW);
        nextStatus = this.handleCoordinatorReview(action);
        break;

      case UserRole.LINE_MANAGER:
        this.ensureCorrectState(application, ApplicationStatus.PENDING_LINE_MANAGER_REVIEW);
        nextStatus = this.handleLineManagerReview(action);
        break;

      case UserRole.DIRECTOR_GENERAL:
        this.ensureCorrectState(application, ApplicationStatus.PENDING_DIRECTOR_GENERAL_REVIEW);
        nextStatus = this.handleDirectorGeneralReview(action);
        break;

      default:
        throw new ForbiddenException('El rol del usuario no tiene permisos para realizar revisiones.');
    }

    return this.prisma.visaApplication.update({
      where: { id },
      data: {
        status: nextStatus,
        observations: reviewDto.reason || `Acción ${action} realizada por ${user.role}`,
      },
    });
  }

  async initiateApplication(userId: string, dto: any, selfieFile: Express.Multer.File): Promise<{ visaApplicationId: string; applicationCode: string; arancelAmount: number; message: string }> {
    // --- VALIDACIÓN DE SEGURIDAD: Correo Verificado ---
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.emailVerified) {
      throw new ForbiddenException('Debe verificar su correo electrónico antes de poder iniciar un trámite de visa.');
    }

    // Desestructuración estricta: Ignoramos campos extra (como el error 'existe')
    const { 
      firstName, lastName, nationality, passportNumber, 
      visaType, gender, birthDate, passportExpiryDate, 
      familyRole, parentApplicationId 
    } = dto;

    // --- VALIDACIÓN DE ROL FAMILIAR ---
    if (familyRole === FamilyRole.DEPENDENT && !parentApplicationId) {
      throw new BadRequestException('Para registrar un familiar dependiente, debe proporcionar el ID de la solicitud del titular (parentApplicationId).');
    }

    if (familyRole === FamilyRole.HOLDER && parentApplicationId) {
      throw new BadRequestException('Una solicitud marcada como TITULAR (HOLDER) no puede depender de otra solicitud.');
    }

    // Obtenemos la configuración para este tipo de visa para conocer el arancel oficial
    const config = await this.visaTypeService.findByType(visaType as VisaType);

    // --- VALIDACIÓN: Existencia de Solicitud Titular (si aplica) ---
    // Solo validamos si es un dependiente y el ID no es la palabra "string" de Swagger
    if (familyRole === FamilyRole.DEPENDENT && parentApplicationId && parentApplicationId !== 'string') {
      const parentExists = await this.prisma.visaApplication.findUnique({
        where: { id: parentApplicationId },
      });
      if (!parentExists) {
        throw new BadRequestException(`El ID de solicitud titular (${parentApplicationId}) no es válido. Debe usar el ID de un TRÁMITE existente, no el ID de su USUARIO.`);
      }
    }

    // --- GESTIÓN FÍSICA DE ARCHIVOS (Área Funcional) ---
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const vType = visaType.toString().toUpperCase();
    
    // 1. Definir carpeta final absoluta en la raíz del backend independiente
    const storageRoot = path.resolve(process.cwd(), 'uploads');
    const targetDir = path.join(storageRoot, year, month, vType);
    await fs.mkdir(targetDir, { recursive: true });

    // 2. Definir nombre y ruta final (mantiene la extensión original del archivo subido)
    const extension = path.extname(selfieFile.originalname).toLowerCase();
    const newFileName = `${dto.passportNumber}-selfie${extension}`.toLowerCase();
    const finalPath = path.join(targetDir, newFileName);

    // 3. Mover el archivo desde la ubicación temporal de Multer a la ubicación final
    await fs.rename(selfieFile.path, finalPath);
    console.log(`Archivo movido a: ${finalPath}`); // Log para tu tranquilidad

    // 4. Generar URL relativa para la base de datos
    const relativePath = path.relative(storageRoot, finalPath).replace(/\\/g, '/');
    const selfieUrl = `/uploads/${relativePath}`;

    let visaApplication; // Declarar aquí para que esté disponible en el catch
    try {
      const generatedCode = await this.generateCorrelative(visaType as VisaType);
      visaApplication = await this.prisma.visaApplication.create({
        data: {
          firstName,
          lastName,
          familyRole: familyRole as FamilyRole,
          selfieUrl: selfieUrl, // Guardamos la ruta directamente en el nuevo campo
          nationality,
          passportNumber,
          userId: userId, // Usar la clave foránea directamente es más estable ante fallos de caché de tipos
          applicationCode: generatedCode, // Asignamos el correlativo automático
          status: ApplicationStatus.DRAFT,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : undefined,
          visaType: visaType as VisaType,
          gender: gender as Gender,
          // Vinculamos al titular si existe
          parentApplicationId: familyRole === FamilyRole.DEPENDENT ? parentApplicationId : null,
        },
      });
    } catch (error) {
      const err = error as any;
      if (err.code === 'P2002' && err.meta?.target?.includes('applicationCode')) {
        throw new BadRequestException(`Error al generar el correlativo de aplicación. Intente de nuevo.`);
      }
      throw error; // Re-lanzar otros errores de Prisma o errores desconocidos
    }

    try {
      // Se registra en la tabla 'Document', relacionada con la 'VisaApplication'
      await this.documentsService.createDocumentRecord(DocumentType.SELFIE, selfieUrl, visaApplication.id);
    } catch (error) {
      // Si falla el registro del documento, eliminamos la visa creada y el archivo físico
      await this.prisma.visaApplication.delete({ where: { id: visaApplication.id } });
      if (selfieFile.path) {
        await fs.unlink(selfieFile.path).catch(() => null); // Borrar el archivo físico
      }
      throw new BadRequestException('Error al registrar la selfie. Intente de nuevo.');
    }

    return {
      visaApplicationId: visaApplication.id,
      applicationCode: visaApplication.applicationCode!,
      arancelAmount: Number(config.arancelAmount),
      message: 'Expediente inicial creado exitosamente. Proceda al pago del arancel.',
    };
  }

  private async generateCorrelative(visaType: VisaType): Promise<string> {
    const count = await this.prisma.visaApplication.count({
      where: { visaType },
    });
    
    // Mapeo de prefijos según los tipos de visa solicitados
    let prefix = 'GEN';
    const typeStr = visaType.toString();

    if (typeStr.includes('TURISTA')) prefix = 'TUR';
    else if (typeStr.includes('NEGOCIOS')) prefix = 'NEG';
    else if (typeStr.includes('PRO_v_90')) prefix = 'PRO';
    else if (typeStr.includes('TLR_ARTISTA')) prefix = 'ART';
    else if (typeStr.includes('TLR_DEPORTISTA')) prefix = 'DEP';
    else prefix = typeStr.substring(0, 3).toUpperCase();

    // Generamos la secuencia con ceros a la izquierda (ej: TUR-00001)
    const sequence = (count + 1).toString().padStart(5, '0');
    return `${prefix}-${sequence}`;
  }

  async initiatePayment(userId: string, visaIds: string[], dto: InitiatePaymentDto, auditData: any): Promise<{ paymentUrl: string | null; paymentId: string; message: string }> {
    // Validación básica de entrada para evitar errores 500
    if (!dto.amount || !dto.currency) {
      throw new BadRequestException('El monto (amount) y la moneda (currency) son obligatorios.');
    }

    // 1. Validar que todas las visas existan y estén en DRAFT
    const visas = await this.prisma.visaApplication.findMany({
      where: { id: { in: visaIds }, userId },
      include: { documents: true }
    });

    if (visas.length !== visaIds.length) {
      throw new NotFoundException('Algunas solicitudes de visa no fueron encontradas.');
    }

    let expectedTotal = 0;
    for (const v of visas) {
      if (v.status !== ApplicationStatus.DRAFT) {
        throw new BadRequestException(`La visa ${v.applicationCode} no está en estado DRAFT.`);
      }

      // REQ: Validar que cumpla con los requisitos configurados antes de pagar
      const config = await this.visaTypeService.findByType(v.visaType);
      expectedTotal += Number(config.arancelAmount);

      const requiredDocs = config.requirements.filter(req => req.isRequired);

      for (const req of requiredDocs) {
        const hasDoc = v.documents.some(doc => doc.type === req.documentType && doc.status !== DocumentStatus.REJECTED);
        if (!hasDoc) {
          throw new BadRequestException(`Trámite ${v.applicationCode} incompleto. Falta cargar: ${req.description || req.documentType}`);
        }
      }
    }

    // REQ: Validar que el monto enviado por el frontend coincida con la suma de aranceles configurados
    if (Math.abs(expectedTotal - dto.amount) > 0.01) {
      throw new BadRequestException(`Error de arancel: El monto enviado ($${dto.amount}) no coincide con el arancel configurado ($${expectedTotal.toFixed(2)}).`);
    }

    // 2. Ejecutar la creación del pago
    // Pasamos los datos limpios. PaymentsService se encargará de vincular los IDs.
    const paymentResponse = await this.paymentsService.create({
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: dto.paymentMethod,
      transactionId: dto.transactionId,
      visaApplicationIds: visaIds, // El servicio de pagos usará esto para el 'connect'
    } as any, auditData); // Cast temporal para evitar error TS2353 hasta actualizar CreatePaymentDto

    return {
      paymentUrl: paymentResponse.paymentUrl,
      paymentId: paymentResponse.id,
      message: 'Orden de pago generada para múltiples trámites exitosamente.',
    };
  }

  async completeForm(id: string, userId: string, dto: CompleteVisaFormDto): Promise<any> {
    const visa = await this.findOne(id, userId);

    if (visa.status !== ApplicationStatus.PENDING_FORM_FILL && visa.status !== ApplicationStatus.CORRECTION) {
      throw new BadRequestException('La solicitud no está en un estado que permita completar el formulario o ya ha sido validada.');
    }

    return this.prisma.visaApplication.update({
      where: { id },
      data: {
        ...dto, // Los campos del DTO se mapean directamente
        arrivalDate: new Date(dto.arrivalDate), // Convertir string a Date
        passportIssueDate: new Date(dto.passportIssueDate),
        maritalStatus: dto.maritalStatus as MaritalStatus,
        status: ApplicationStatus.VALIDATION, // Una vez completado el formulario, pasa a revisión
        observations: 'Formulario extenso completado por el ciudadano.',
      },
    });
  }

  async getTrackingStatus(applicationCode: string, passportNumber: string) {
    const visa = await this.prisma.visaApplication.findFirst({
      where: { applicationCode, passportNumber },
      select: {
        applicationCode: true,
        status: true,
        observations: true,
        updatedAt: true,
        firstName: true,
        lastName: true
      }
    });

    if (!visa) {
      throw new NotFoundException('No se encontró ninguna solicitud con esos datos.');
    }

    return visa;
  }

  async addDocuments(visaApplicationId: string, userId: string, files: Array<Express.Multer.File>) {
    // Verificar que la solicitud existe
    const visa = await this.findOne(visaApplicationId, userId);

    // Si estaba en CORRECTION, al subir nuevos documentos vuelve a VALIDATION
    if (visa.status === ApplicationStatus.CORRECTION || visa.status === ApplicationStatus.PENDING_FORM_FILL) {
      await this.prisma.visaApplication.update({
        where: { id: visaApplicationId },
        data: { status: ApplicationStatus.VALIDATION, observations: 'Documentos actualizados por el ciudadano.' }
      });
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const vType = visa.visaType.toString().toUpperCase();
    const storageRoot = path.resolve(process.cwd(), 'uploads');
    const targetDir = path.join(storageRoot, year, month, vType);
    await fs.mkdir(targetDir, { recursive: true });

    const documentRecords = await Promise.all(
      files.map(async (file) => {
        // Mover archivo a la estructura jerárquica
        const extension = path.extname(file.originalname).toLowerCase();
        const newFileName = `${visa.passportNumber}-doc-${Date.now()}-${Math.round(Math.random() * 1e4)}${extension}`;
        const finalPath = path.join(targetDir, newFileName);
        
        await fs.rename(file.path, finalPath);

        const relativePath = path.relative(storageRoot, finalPath).replace(/\\/g, '/');
        const url = `/uploads/${relativePath}`;

        return this.documentsService.createDocumentRecord(
          DocumentType.SUPPORTING_DOC,
          url,
          visaApplicationId
        );
      })
    );

    return {
      message: `${files.length} documentos cargados exitosamente.`,
      documents: documentRecords,
    };
  }

  // El método create original ahora es más simple, asumiendo que ya no se usa para la creación inicial
  async create(dto: CreateVisaDto): Promise<any> {
    const { birthDate, arrivalDate, gender, maritalStatus, visaType, status, email, applicationCode } = dto;

    return this.prisma.visaApplication.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        passportNumber: dto.passportNumber,
        nationality: dto.nationality,
        applicationCode: applicationCode,
        user: { connect: { email: email } }, // Conexión formal con el usuario de LDAP
        birthDate: birthDate ? new Date(birthDate) : undefined,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : undefined,
        gender: gender as Gender,
        maritalStatus: maritalStatus as MaritalStatus,
        visaType: visaType as VisaType,
        status: status as ApplicationStatus,
      },
    });
  }

  async findAll(userId: string, role: UserRole) {
    // Si es Ciudadano, filtramos por su ID. Si es Admin/Officer, ve todo.
    const where = role === UserRole.CITIZEN ? { userId } : {};
    
    return this.prisma.visaApplication.findMany({
      where,
      include: { documents: true }, // Incluir documentos para ver las rutas de las fotos
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const visa = await this.prisma.visaApplication.findFirst({ 
      where: { id, userId },
      include: { documents: true } // Incluir documentos para ver las rutas de las fotos
    });
    if (!visa) throw new NotFoundException(`Solicitud de visa ${id} no encontrada`);
    return visa;
  }

  async updateStatus(id: string, dto: UpdateVisaStatusDto): Promise<any> {
    // Buscamos la visa e incluimos los datos del usuario para tener su email y nombre
    const visa = await this.prisma.visaApplication.findUnique({ 
      where: { id },
      include: { user: true }
    });

    if (!visa) throw new NotFoundException(`Solicitud de visa ${id} no encontrada`);

    const updatedVisa = await this.prisma.visaApplication.update({
      where: { id },
      data: {
        status: dto.status,
        observations: dto.observations || visa.observations, // Mantener observaciones si no se actualizan
      },
    });

    // Disparamos la notificación (ahora con await para detectar errores de envío)
    try {
      if (visa.user) {
        await this.mailService.sendStatusUpdateEmail(
          visa.user.email,
          visa.user.firstName || 'Usuario',
          visa.applicationCode || id,
          dto.status,
          dto.observations
        );
      }
    } catch (mailError) {
      console.error('Error al enviar el correo de cambio de estatus:', mailError);
      // No lanzamos excepción aquí para no revertir el cambio de estatus en la BD si solo falló el correo
    }

    return updatedVisa;
  }

  /**
   * Obtiene el expediente completo (datos de la visa + documentos + pagos)
   * Gracias a las relaciones definidas en Prisma.
   */
  async getCompleteFile(id: string, userId: string) {
    const visa = await this.prisma.visaApplication.findFirst({
      where: { id, userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        payment: true,
      },
    });

    if (!visa) {
      throw new NotFoundException(`Expediente de visa ${id} no encontrado`);
    }

    return visa;
  }

  async remove(id: string, userId: string) {
    const visa = await this.findOne(id, userId);
    return this.prisma.visaApplication.delete({ where: { id: visa.id } });
  }

  /**
   * REQ 3: Conciliación Síncrona con Bancamiga y actualización masiva (Titular + Dependientes)
   */
  async verifyPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || !payment.gatewayToken) {
      throw new BadRequestException('El pago no existe o no tiene un token del banco.');
    }

    // Consultamos usando el token que nos dio el banco (gatewayToken)
    const bancamigaResponse = await fetch(`https://payments3ds.bancamiga.com/form/orden/${payment.gatewayToken}`, {
      headers: { 'Authorization': `Bearer ${process.env.BANCAMIGA_TOKEN}` }
    }).then(res => res.json());

    const isApproved = bancamigaResponse?.data?.Status === 'approved';

    if (isApproved) {
      // REQ 3.3: Ejecutar actualización en bloque mediante $transaction
      return this.prisma.$transaction(async (tx) => {
        // a. Actualizar el estado del pago
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'COMPLETED' }
        });

        // Contamos cuántas solicitudes están asociadas a este pago
        const appCount = await tx.visaApplication.count({
          where: { paymentId: paymentId }
        });

        // Definimos la observación según si es un trámite individual o grupal/familiar
        const observationMsg = appCount > 1 
          ? 'Pago global familiar verificado. Trámites listos para revisión de Analista.'
          : 'Pago verificado exitosamente vía Bancamiga.';

        // b. Actualizar todas las visas asociadas simultáneamente
        const updatedApplications = await tx.visaApplication.updateMany({
          where: { 
            paymentId: paymentId,
            status: { in: [ApplicationStatus.PENDING_FORM_FILL, ApplicationStatus.DRAFT] }
          },
          data: { 
            status: ApplicationStatus.VALIDATION,
            observations: observationMsg
          }
        });

        return {
          success: true,
          message: 'Pago conciliado y trámites avanzados a VALIDATION.',
          count: updatedApplications.count
        };
      });
    } else {
      // Si es rechazado, actualizamos el pago pero dejamos las visas para reintento
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' }
      });
      
      return {
        success: false,
        message: 'El pago fue rechazado por la entidad bancaria.',
        status: bancamigaResponse?.data?.Status
      };
    }
  }

  // =================================================================
  // === MÉTODOS PRIVADOS DE APOYO PARA REVISIÓN ===
  // =================================================================

  private ensureCorrectState(application: VisaApplication, expectedStatus: ApplicationStatus) {
    if (application.status !== expectedStatus) {
      throw new BadRequestException(`El trámite no se encuentra en el estado esperado (${expectedStatus}).`);
    }
  }

  private async handleOfficerReview(application: ApplicationWithDocuments, action: ReviewAction): Promise<ApplicationStatus> {
    // REQ 1.1: Si marca un documento como REJECTED, cambia a CORRECTION
    const hasRejectedDocs = application.documents.some(doc => doc.status === DocumentStatus.REJECTED);
    
    if (hasRejectedDocs || action === ReviewAction.RETURN) return ApplicationStatus.CORRECTION;
    if (action === ReviewAction.APPROVE) return ApplicationStatus.PENDING_COORDINATOR_REVIEW;
    
    return ApplicationStatus.REJECTED;
  }

  private handleCoordinatorReview(action: ReviewAction): ApplicationStatus {
    // REQ 1.2: Puede devolver a VALIDATION o avanzar
    if (action === ReviewAction.APPROVE) return ApplicationStatus.PENDING_LINE_MANAGER_REVIEW;
    if (action === ReviewAction.RETURN) return ApplicationStatus.VALIDATION;
    return ApplicationStatus.REJECTED;
  }

  private handleLineManagerReview(action: ReviewAction): ApplicationStatus {
    // REQ 1.3: El Director de Línea devuelve al Analista (VALIDATION) según requerimiento
    if (action === ReviewAction.APPROVE) return ApplicationStatus.PENDING_DIRECTOR_GENERAL_REVIEW;
    if (action === ReviewAction.RETURN) return ApplicationStatus.VALIDATION;
    return ApplicationStatus.REJECTED;
  }

  private handleDirectorGeneralReview(action: ReviewAction): ApplicationStatus {
    // REQ 1.4: Decisión final
    if (action === ReviewAction.APPROVE) return ApplicationStatus.APPROVED;
    if (action === ReviewAction.RETURN) return ApplicationStatus.PENDING_LINE_MANAGER_REVIEW;
    return ApplicationStatus.REJECTED;
  }
}