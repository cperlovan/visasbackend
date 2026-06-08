import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationGateway } from './verification.gateway';
import { SubmitScanDto } from './dto/submit-scan.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos internos
// ─────────────────────────────────────────────────────────────────────────────

// visaApplicationId es OPCIONAL: permite crear sesión sin solicitud previa
interface SessionPayload {
  sessionId: string;
  visaApplicationId?: string;
  userId: string;
  type: 'verification_session';
}

interface MrzData {
  firstName: string;
  lastName: string;
  passportNumber: string;
  birthDate: string;
  expiryDate: string;
  nationality: string;
  gender: string;
  rawMrz?: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly sessionSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly gateway: VerificationGateway,
  ) {
    // AÑADE TODO ESTE BLOQUE DENTRO DEL CONSTRUCTOR
    this.sessionSecret = process.env.VERIFICATION_SESSION_SECRET;
    if (!this.sessionSecret) {
      this.logger.error(
        'La variable de entorno VERIFICATION_SESSION_SECRET no está definida.',
      );
      throw new InternalServerErrorException(
        'El servicio de verificación no está configurado correctamente.',
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CREAR SESIÓN
  // visaApplicationId es opcional: si se omite, se creará una nueva solicitud
  // al momento del escaneo.
  // ───────────────────────────────────────────────────────────────────────────
  async createSession(
    visaApplicationId: string | undefined,
    userId: string,
  ): Promise<{ sessionId: string; sessionToken: string; qrUrl: string }> {
    // Solo validar la solicitud si se proporcionó un ID
    if (visaApplicationId) {
      const application = await this.prisma.visaApplication.findFirst({
        where: { id: visaApplicationId, userId },
      });
      if (!application) {
        throw new BadRequestException(
          'Solicitud de visa no encontrada o no pertenece al usuario',
        );
      }
    }

    const sessionId = uuidv4();

    const sessionToken = this.jwtService.sign(
      {
        sessionId,
        visaApplicationId,
        userId,
        type: 'verification_session',
      } as SessionPayload,
      {
        expiresIn: '10m',
        secret: this.sessionSecret, // <-- ¡ESTE ES EL CAMBIO QUE FALTA!
      },
    );


    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const baseUrl = frontendUrl.endsWith('/')
      ? frontendUrl.slice(0, -1)
      : frontendUrl;
    const qrUrl = `${baseUrl}/passportVerify?token=${sessionToken}`;

    this.logger.log(
      `📱 Sesión creada: ${sessionId} — solicitud: ${visaApplicationId ?? '(se creará al escanear)'}`,
    );

    return { sessionId, sessionToken, qrUrl };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. PROCESAR ESCANEO
  // El celular llama a este método con la foto del MRZ y la selfie.
  // Si no había visaApplicationId en el token, se CREA una nueva solicitud.
  // Si ya había uno, se ACTUALIZA la solicitud existente.
  // ───────────────────────────────────────────────────────────────────────────
  async processScan(dto: SubmitScanDto): Promise<{ message: string }> {
    // 2a. Validar y decodificar el token de sesión
    let payload: SessionPayload;
    try {
      payload = this.jwtService.verify<SessionPayload>(dto.sessionToken, {
        secret: this.sessionSecret, // <-- MODIFICA ESTA LÍNEA
      });
    } catch (error) { // <-- AÑADE (error)
      this.logger.error('Fallo en la verificación del token de sesión', error); // <-- AÑADE LOG
      throw new UnauthorizedException(
        'Token de sesión inválido o expirado. Por favor, genera un nuevo QR.',
      );
    }

    if (payload.type !== 'verification_session') {
      throw new UnauthorizedException('Tipo de token incorrecto');
    }

    const { sessionId, userId } = payload;
    // 'let' porque puede ser reasignado si se crea una nueva solicitud
    let { visaApplicationId } = payload;

    try {
      // 2b. Procesar OCR del MRZ
      this.logger.log(`🔍 Procesando OCR para sesión ${sessionId}...`);
      const mrzData = await this.processMrzOcr(dto.mrzImageBase64);

      // 2c. CREAR o ACTUALIZAR la solicitud de visa
      if (!visaApplicationId) {
        // ── CREAR: no había solicitud previa ──────────────────────────────
        this.logger.log(
          `🌱 Creando nueva solicitud de visa para usuario ${userId}`,
        );
        const newApplication = await this.prisma.visaApplication.create({
          data: {
            user: { connect: { id: userId } },
            firstName: mrzData.firstName,
            lastName: mrzData.lastName,
            passportNumber: mrzData.passportNumber,
            birthDate: mrzData.birthDate
              ? new Date(mrzData.birthDate)
              : undefined,
            passportExpiryDate: mrzData.expiryDate
              ? new Date(mrzData.expiryDate)
              : undefined,
            nationality: mrzData.nationality,
            gender: this.mapGender(mrzData.gender),
            // Campo obligatorio: valor por defecto hasta que el usuario lo cambie
            visaType: 'TURISTA',
          },
        });
        visaApplicationId = newApplication.id;
        this.logger.log(`✅ Nueva solicitud creada: ${visaApplicationId}`);
      } else {
        // ── ACTUALIZAR: ya existía la solicitud ───────────────────────────
        await this.prisma.visaApplication.update({
          where: { id: visaApplicationId },
          data: {
            firstName: mrzData.firstName,
            lastName: mrzData.lastName,
            passportNumber: mrzData.passportNumber,
            birthDate: mrzData.birthDate
              ? new Date(mrzData.birthDate)
              : undefined,
            passportExpiryDate: mrzData.expiryDate
              ? new Date(mrzData.expiryDate)
              : undefined,
            nationality: mrzData.nationality,
            gender: this.mapGender(mrzData.gender),
          },
        });
        this.logger.log(
          `✅ Solicitud actualizada con datos del pasaporte: ${visaApplicationId}`,
        );
      }

      // 2d. Guardar la selfie en disco (carpeta uploads/selfies/)
      const selfieUrl = await this.saveSelfie(
        dto.selfieImageBase64,
        visaApplicationId,
      );

      // 2e. Comparación facial — score simulado hasta Fase 3 (CompreFace)
      const faceMatchScore = await this.compareFaces(
        dto.mrzImageBase64,
        dto.selfieImageBase64,
      );

      // 2f. Guardar la URL de la selfie en la solicitud
      await this.prisma.visaApplication.update({
        where: { id: visaApplicationId },
        data: { selfieUrl },
      });

      this.logger.log(
        `💾 Selfie vinculada a la solicitud ${visaApplicationId}`,
      );

      // 2g. Notificar al escritorio vía WebSocket
      this.gateway.notifyDesktop(sessionId, {
        status: 'success',
        passportData: {
          firstName: mrzData.firstName,
          lastName: mrzData.lastName,
          passportNumber: mrzData.passportNumber,
          birthDate: mrzData.birthDate,
          expiryDate: mrzData.expiryDate,
          nationality: mrzData.nationality,
          gender: mrzData.gender,
        },
        faceMatchScore,
        selfieUrl,
        visaApplicationId,
      });

      return { message: 'Verificación completada con éxito' };
    } catch (error) {
      this.logger.error(
        `❌ Error procesando escaneo para sesión ${sessionId}:`,
        error,
      );

      // Notificar al escritorio del fallo para que no quede esperando
      this.gateway.notifyDesktop(sessionId, {
        status: 'failed',
        error: 'Error al procesar el pasaporte. Por favor intenta nuevamente.',
      });

      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MÉTODOS PRIVADOS DE PROCESAMIENTO
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Procesa el OCR de la zona MRZ del pasaporte.
   *
   * FASE ACTUAL: Retorna datos de ejemplo (STUB).
   * FASE 3: Se conectará al microservicio Tesseract on-premise.
   *
   * Línea 1: P<VENPEREZ<<JUAN<CARLOS<<<<<<<<<<<<<<<<<<<<
   * Línea 2: AB1234567VEN9005151M3001011<<<<<<<<<<<<<<<6
   */
  private async processMrzOcr(_mrzImageBase64: string): Promise<MrzData> {
    // ── STUB ─────────────────────────────────────────────────────────────────
    // En Fase 3 reemplazar por:
    // const response = await axios.post(`${process.env.TESSERACT_URL}/ocr`, {
    //   image: mrzImageBase64,
    //   mode: 'mrz',
    // });
    // return this.parseMrzLines(response.data.text);
    // ─────────────────────────────────────────────────────────────────────────
    this.logger.warn('⚠️  OCR en modo STUB — conectar Tesseract en Fase 3');

    return {
      firstName: 'JUAN CARLOS',
      lastName: 'PEREZ',
      passportNumber: 'AB1234567',
      birthDate: '1990-05-15',
      expiryDate: '2030-01-01',
      nationality: 'VEN',
      gender: 'M',
      rawMrz: 'STUB_MRZ_DATA',
    };
  }

  /**
   * Parsea las 2 líneas del MRZ estándar ICAO 9303 (TD3 - Pasaporte).
   * Se usará cuando Tesseract devuelva el texto crudo en Fase 3.
   */
  parseMrzLines(mrzText: string): MrzData {
    const lines = mrzText
      .replace(/\s+/g, '\n')
      .split('\n')
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l.length >= 44);

    if (lines.length < 2) {
      throw new BadRequestException(
        'No se pudo leer la zona MRZ del pasaporte. Por favor, asegúrate de que la imagen sea nítida.',
      );
    }

    const line1 = lines[0].padEnd(44, '<');
    const line2 = lines[1].padEnd(44, '<');

    // Línea 1: posición 5-43 → apellidos<<nombres
    const nameField = line1.substring(5, 44).replace(/</g, ' ').trim();
    const nameParts = nameField.split('  '); // doble espacio separa apellido de nombre
    const lastName = (nameParts[0] || '').trim();
    const firstName = (nameParts[1] || '').trim();

    // Línea 2: datos del documento
    const passportNumber = line2.substring(0, 9).replace(/</g, '');
    const nationality = line2.substring(10, 13).replace(/</g, '');
    const birthDateRaw = line2.substring(13, 19); // AAMMDD
    const gender = line2.substring(20, 21);
    const expiryDateRaw = line2.substring(21, 27); // AAMMDD

    return {
      firstName,
      lastName,
      passportNumber,
      birthDate: this.parseMrzDate(birthDateRaw, true),
      expiryDate: this.parseMrzDate(expiryDateRaw, false),
      nationality,
      gender,
    };
  }

  /**
   * Convierte fecha MRZ (AAMMDD) a formato ISO (YYYY-MM-DD).
   * @param isPastDate true para fechas de nacimiento (determina el siglo)
   */
  private parseMrzDate(mrzDate: string, isPastDate: boolean): string {
    if (!mrzDate || mrzDate.length !== 6) return '';

    const yy = parseInt(mrzDate.substring(0, 2), 10);
    const mm = mrzDate.substring(2, 4);
    const dd = mrzDate.substring(4, 6);

    const currentYear = new Date().getFullYear() % 100;
    let yyyy: number;

    if (isPastDate) {
      yyyy = yy > currentYear ? 1900 + yy : 2000 + yy;
    } else {
      yyyy = yy <= currentYear + 10 ? 2000 + yy : 1900 + yy;
    }

    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Guarda la selfie en Base64 como archivo en el servidor.
   * Retorna la URL relativa para acceder al archivo.
   */
  private async saveSelfie(
    selfieBase64: string,
    visaApplicationId: string,
  ): Promise<string> {
    const matches = selfieBase64.match(
      /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/,
    );

    if (!matches) {
      throw new BadRequestException(
        'Formato de imagen de selfie inválido. Se esperaba Base64 con prefijo data:image/...',
      );
    }

    const extension = matches[1] === 'jpg' ? 'jpeg' : matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, 'base64');

    const uploadDir = path.join(process.cwd(), 'uploads', 'selfies');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `selfie_${visaApplicationId}_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    this.logger.log(`💾 Selfie guardada: ${filename}`);

    // NestJS sirve /uploads como estático
    return `/uploads/selfies/${filename}`;
  }

  /**
   * Compara dos imágenes faciales.
   *
   * FASE ACTUAL: Retorna score simulado (0.95 = 95% de similitud).
   * FASE 3: Se conectará a CompreFace on-premise via HTTP.
   */
  private async compareFaces(
    _referenceImageBase64: string,
    _selfieBase64: string,
  ): Promise<number> {
    // ── STUB ─────────────────────────────────────────────────────────────────
    // En Fase 3 reemplazar por:
    // const response = await axios.post(
    //   `${process.env.COMPREFACE_URL}/api/v1/verification/verify`,
    //   { source_image: referenceImageBase64, target_image: selfieBase64 },
    //   { headers: { 'x-api-key': process.env.COMPREFACE_API_KEY } },
    // );
    // return response.data.result[0].face_matches[0].similarity;
    // ─────────────────────────────────────────────────────────────────────────
    this.logger.warn(
      '⚠️  FaceMatch en modo STUB — conectar CompreFace en Fase 3',
    );
    return 0.95;
  }

  /**
   * Mapea el género del formato MRZ ('M'/'F') al enum de Prisma.
   */
  private mapGender(mrzGender: string): 'MALE' | 'FEMALE' | 'OTHER' {
    if (mrzGender === 'M') return 'MALE';
    if (mrzGender === 'F') return 'FEMALE';
    return 'OTHER';
  }
}
