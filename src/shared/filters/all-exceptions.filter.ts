import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'

/**
 * Global Exception Filter para todas las excepciones no manejadas
 * Registra todos los errores y devuelve respuestas consistentes
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // Obtener información del usuario si está autenticado
    const user = (request as any).user
    const userContext = user
      ? {
          userId: user.id,
          userEmail: user.email,
        }
      : {}

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Error interno del servidor'
    let errorDetails: any = {}

    // Determinar tipo de excepción
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message
        errorDetails = exceptionResponse
      }
    } else if (exception instanceof Error) {
      message = exception.message
      errorDetails = {
        name: exception.name,
        stack: exception.stack,
      }
    }

    // Log de la excepción con contexto completo
    this.logger.logException(exception as Error, {
      ...userContext,
      method: request.method,
      url: request.url,
      ip: request.ip,
      statusCode: status,
      errorDetails,
    })

    // Respuesta al cliente
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
