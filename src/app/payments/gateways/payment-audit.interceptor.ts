import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class PaymentAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Creamos una copia de los headers para evitar modificar el original
    const rawHeaders = request.headers;
    const sanitizedHeaders: Record<string, any> = {};

    // Lista de llaves sensibles (en minúsculas, ya que Node.js normaliza los headers)
    const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'token', 'set-cookie'];

    for (const key in rawHeaders) {
      if (rawHeaders.hasOwnProperty(key) && !sensitiveKeys.includes(key)) {
        sanitizedHeaders[key] = rawHeaders[key];
      }
    };

    // Captura de metadatos según requerimientos de Bancamiga
    const auditData = {
      ip: request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      originUrl: request.headers['origin'] || request.headers['referer'],
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),
      // Se adjunta al request para que el controlador pueda extraerlo fácilmente
      metadata: {
        headers: sanitizedHeaders,
      }
    };

    request['paymentAudit'] = auditData;
    return next.handle();
  }
}