import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    // En producción on-premise, reemplazar con la IP/dominio real del servidor
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/verification', // Namespace dedicado para no mezclar con otros WS futuros
})
export class VerificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VerificationGateway.name);

  afterInit() {
    this.logger.log('✅ WebSocket Gateway de Verificación iniciado');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);
  }

  /**
   * El escritorio (Next.js) se une a una sala usando el sessionId.
   * Así cuando el celular envíe los datos, NestJS sabe a qué
   * cliente de escritorio notificar.
   *
   * Evento que emite el frontend:
   * socket.emit('join_session', { sessionId: 'uuid-de-la-sesion' })
   */
  @SubscribeMessage('join_session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;

    if (!sessionId) {
      client.emit('error', { message: 'sessionId requerido' });
      return;
    }

    // El cliente de escritorio se une a una "sala" con el ID de sesión
    client.join(sessionId);
    this.logger.log(`🖥️  Escritorio unido a sala de sesión: ${sessionId}`);

    // Confirmamos al escritorio que está escuchando correctamente
    client.emit('session_joined', {
      sessionId,
      status: 'waiting_scan',
      message: 'Esperando escaneo desde el celular...',
    });
  }

  /**
   * Método llamado INTERNAMENTE por VerificationService
   * (no es un evento de WS directo) para notificar al escritorio
   * cuando el celular ya envió y procesó los datos.
   */
  notifyDesktop(
    sessionId: string,
    payload: {
      status: 'success' | 'failed';
      passportData?: {
        firstName: string;
        lastName: string;
        passportNumber: string;
        birthDate: string;
        expiryDate: string;
        nationality: string;
        gender: string;
      };
      faceMatchScore?: number;
      selfieUrl?: string;
      error?: string;
    },
  ) {
    this.logger.log(
      `📡 Notificando escritorio en sala ${sessionId} → status: ${payload.status}`,
    );

    // Emite el evento a TODOS los clientes en esa sala (el escritorio)
    this.server.to(sessionId).emit('verification_complete', payload);
  }
}
