import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UploadedFile, UploadedFiles, Req, BadRequestException, Query, Patch, UseGuards, ParseUUIDPipe, NotFoundException, ForbiddenException } from '@nestjs/common';
import { VisasService } from './visas.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiProperty, ApiPropertyOptional, ApiParam, ApiQuery, ApiBearerAuth, OmitType } from '@nestjs/swagger';
import { CreateVisaDto } from './dto/create-visa.dto';
import { CreateInitialVisaDto } from './dto/create-initial-visa.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { CompleteVisaFormDto } from './dto/complete-visa-form.dto';
import { UpdateVisaStatusDto } from './dto/update-visa-status.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PaymentAuditInterceptor } from '../payments/gateways/payment-audit.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, User, ApplicationStatus, DocumentStatus, VisaApplication, Document, FamilyRole } from '@prisma/client';
import { ReviewApplicationDto, ReviewAction } from './dto/review-application.dto';
import { IsOptional, IsUUID, ValidateIf, IsEnum } from 'class-validator';

// Clase para que Swagger entienda que el cuerpo incluye un archivo y los datos del DTO
// Omitimos 'email' y 'applicationCode' porque el sistema los maneja internamente
class VisaInitiateWithFileDto extends OmitType(CreateInitialVisaDto, ['email', 'applicationCode'] as const) {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Imagen de selfie del solicitante' })
  selfie!: any;

  @ApiProperty({ enum: FamilyRole, default: FamilyRole.HOLDER, description: 'Rol de la solicitud (HOLDER para titular, DEPENDENT para familiares)' })
  @IsEnum(FamilyRole)
  familyRole!: FamilyRole;

  @ApiPropertyOptional({ description: 'ID de la solicitud del titular (para dependientes)' })
  @IsOptional()
  @ValidateIf((o) => o.familyRole === FamilyRole.DEPENDENT && o.parentApplicationId && o.parentApplicationId !== '')
  @IsUUID()
  parentApplicationId?: string;
}

// Clase para que Swagger muestre el botón de carga de múltiples archivos
class VisaUploadDocumentsDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Documentos o recaudos de soporte' })
  documents!: any[];
}

// Configuración de Multer para imágenes
const imageUploadConfig = {
  storage: diskStorage({
    destination: (req: any, file, cb) => {
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const visaType = (req.body?.visaType || 'GENERIC').toUpperCase();
      const uploadPath = path.resolve(process.cwd(), 'uploads', year, month, visaType);
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req: any, file, cb) => {
      const passport = req.body?.passportNumber || `TMP-${Date.now()}`;
      const suffix = file.fieldname === 'selfie' ? 'selfie' : `doc-${Date.now()}`;
      const name = `${passport}-${suffix}${path.extname(file.originalname)}`.toLowerCase();
      cb(null, name);
    },
  }),
  fileFilter: (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
      return cb(new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png) o archivos PDF.'), false);
    }
    cb(null, true);
  },
};

@ApiTags('visas')
@ApiBearerAuth()
@Controller('v1/tramites/visas')
export class VisasController {
  constructor(private readonly visasService: VisasService) {}

  // -----------------------------------------------------------------
  // --- BLOQUE 1: BANDEJAS DE GESTIÓN (BACKOFFICE) ---
  // -----------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OFFICER, UserRole.COORDINATOR, UserRole.LINE_MANAGER, UserRole.DIRECTOR_GENERAL)
  @Get('review/queue')
  @ApiOperation({ summary: 'Bandeja de trámites para revisión (Funcionarios)' })
  getReviewQueue(@GetUser() user: User) {
    return this.visasService.getReviewQueue(user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OFFICER, UserRole.COORDINATOR, UserRole.LINE_MANAGER, UserRole.DIRECTOR_GENERAL)
  @Patch('review/:id')
  @ApiOperation({ summary: 'Procesar una acción de revisión sobre un trámite (Funcionarios)' })
  @ApiParam({ name: 'id', description: 'ID de la aplicación de visa' })
  reviewApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewApplicationDto,
    @GetUser() user: User,
  ) {
    return this.visasService.reviewApplication(id, reviewDto, user);
  }

  // -----------------------------------------------------------------
  // --- BLOQUE 2: FLUJO DEL CIUDADANO (FRONT OFFICE) ---
  // -----------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.CITIZEN)
  @Post('initiate')
  @UseInterceptors(FileInterceptor('selfie', imageUploadConfig))
  @ApiOperation({ summary: 'Paso 1: Registro mínimo y selfie (Ciudadano)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VisaInitiateWithFileDto })
  async initiateApplication(
    @GetUser('id') userId: string,
    @Body() createInitialVisaDto: VisaInitiateWithFileDto,
    @UploadedFile() selfie: Express.Multer.File,
  ): Promise<any> {
    if (!selfie) throw new BadRequestException('Se requiere el archivo de selfie para el registro inicial.');
    return this.visasService.initiateApplication(userId, createInitialVisaDto, selfie);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.CITIZEN)
  @Post(':id/initiate-payment')
  @UseInterceptors(PaymentAuditInterceptor)
  @ApiOperation({ summary: 'Paso 2: Iniciar proceso de pago para uno o varios trámites (Ciudadano)' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de visa' })
  async initiatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @Body() body: InitiatePaymentDto & { visaIds?: string[] },
    @Req() req: any
  ): Promise<any> {
    const auditData = req['paymentAudit'];
    // Si el body trae un array de IDs lo usamos (pago grupal), 
    // de lo contrario usamos el ID de la URL (pago individual)
    const visaIds = body.visaIds && body.visaIds.length > 0 ? body.visaIds : [id];
    return this.visasService.initiatePayment(userId, visaIds, body, auditData);
  }

  @Get('payment/:id/verify')
  @ApiOperation({ summary: 'Paso 2.1: Verificar pago en Bancamiga y activar expedientes' })
  @ApiParam({ name: 'id', description: 'ID del registro de Pago' })
  async verifyPayment(@Param('id') paymentId: string) {
    return this.visasService.verifyPayment(paymentId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/complete-form')
  @ApiOperation({ summary: 'Paso 3: Completar formulario extenso (Ciudadano)' })
  @ApiParam({ name: 'id', description: 'ID de la aplicación de visa' })
  async completeForm(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() completeVisaFormDto: CompleteVisaFormDto
  ): Promise<any> {
    return this.visasService.completeForm(id, userId, completeVisaFormDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.CITIZEN)
  @Post(':id/documents')
  @UseInterceptors(FilesInterceptor('documents', 10, imageUploadConfig))
  @ApiOperation({ summary: 'Subir documentos adicionales de soporte' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VisaUploadDocumentsDto })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de visa' })
  async uploadDocuments(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ): Promise<any> {
    if (!files || files.length === 0) throw new BadRequestException('No se subieron archivos.');
    return this.visasService.addDocuments(id, userId, files);
  }

  // -----------------------------------------------------------------
  // --- BLOQUE 3: CONSULTAS Y ADMINISTRACIÓN ---
  // -----------------------------------------------------------------
  @Get('track')
  @ApiOperation({ summary: 'Consultar estatus y observaciones del trámite (Público)' })
  @ApiQuery({ name: 'applicationCode', example: 'VIS-2026-001' })
  @ApiQuery({ name: 'passportNumber', example: 'ABC123456' })
  async getTrackingStatus(
    @Query('applicationCode') applicationCode: string,
    @Query('passportNumber') passportNumber: string
  ): Promise<any> {
    return this.visasService.getTrackingStatus(applicationCode, passportNumber);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @Post()
  @ApiOperation({ summary: 'Registrar una nueva solicitud de visa (Admin)' })
  async create(@Body() createVisaDto: CreateVisaDto): Promise<any> {
    return this.visasService.create(createVisaDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.CONSUL, UserRole.CITIZEN)
  @Get()
  @ApiOperation({ summary: 'Listar trámites (Admin/Officer ve todo, Citizen ve los suyos)' })
  async findAll(
    @GetUser('id') userId: string,
    @GetUser('role') role: UserRole
  ): Promise<any[]> {
    return this.visasService.findAll(userId, role);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle básico de una solicitud' })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string): Promise<any> {
    return this.visasService.findOne(id, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id/complete-file')
  @ApiOperation({ summary: 'Obtener el expediente completo (Datos + Documentos + Pagos)' })
  async getCompleteFile(@Param('id') id: string, @GetUser('id') userId: string): Promise<any> {
    return this.visasService.getCompleteFile(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('id') userId: string): Promise<any> {
    return this.visasService.remove(id, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.CONSUL)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estatus de expediente (Admin/Consular)' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud de visa' })
  async updateStatus(@Param('id') id: string, @Body() updateVisaStatusDto: UpdateVisaStatusDto): Promise<any> {
    return this.visasService.updateStatus(id, updateVisaStatusDto);
  }
}