import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitScanDto } from './dto/submit-scan.dto';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/verification/session
  // Lo llama el ESCRITORIO (Next.js) cuando el usuario llega al paso
  // de verificación de pasaporte. Devuelve el token para el QR.
  // ───────────────────────────────────────────────────────────────────────────
  @Post('session')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear sesión de verificación de pasaporte',
    description:
      'Genera un token de sesión único (válido 10 min) que se codifica en un QR. ' +
      'El escritorio lo muestra al usuario para que lo escanee con su celular.',
  })
  @ApiResponse({
    status: 201,
    description: 'Sesión creada exitosamente',
    schema: {
      example: {
        sessionId: 'uuid-de-la-sesion',
        sessionToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        qrUrl: 'http://localhost:3000/verificar-pasaporte?token=eyJ...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Solicitud de visa no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createSession(
    @Body() dto: CreateSessionDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.verificationService.createSession(dto.visaApplicationId, userId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/verification/submit
  // Lo llama el CELULAR (página web móvil de Next.js) con las imágenes.
  // NO requiere JWT de usuario — usa el token de sesión del QR.
  // ───────────────────────────────────────────────────────────────────────────
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar datos del escaneo desde el celular',
    description:
      'Recibe la foto del MRZ del pasaporte y la selfie desde el celular. ' +
      'Procesa el OCR, realiza el facematch y notifica al escritorio vía WebSocket.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación procesada exitosamente',
    schema: {
      example: { message: 'Verificación completada con éxito' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de sesión inválido o expirado',
  })
  async submitScan(@Body() dto: SubmitScanDto) {
    return this.verificationService.processScan(dto);
  }
}
