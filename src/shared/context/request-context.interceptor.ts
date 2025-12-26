import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { RequestContext } from './request-context.service'
import { User } from 'src/core/users/domain/user'
import { randomUUID } from 'crypto'

/**
 * Interceptor que captura el contexto de la request y lo almacena en RequestContext.
 *
 * Debe ser registrado globalmente para que todas las requests pasen por aquí.
 *
 * Captura:
 * - Usuario autenticado (si existe)
 * - IP del cliente
 * - User Agent
 * - Request ID (genera uno si no existe)
 *
 * @example
 * ```typescript
 * // En app.module.ts o main.ts
 * app.useGlobalInterceptors(new RequestContextInterceptor(requestContext))
 * ```
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()

    // Extraer información de la request
    const user = request.user as User | undefined
    const userId = user?.id
    const ip = this.getClientIp(request)
    const userAgent = request.headers['user-agent']
    const requestId = request.headers['x-request-id'] || randomUUID()

    // Ejecutar el handler dentro del contexto
    return new Observable((subscriber) => {
      this.requestContext.run(
        {
          userId,
          ip,
          userAgent,
          requestId,
        },
        () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          })
        },
      )
    })
  }

  /**
   * Obtiene la IP real del cliente, considerando proxies y balanceadores de carga.
   */
  private getClientIp(request: any): string | undefined {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress
    )
  }
}
