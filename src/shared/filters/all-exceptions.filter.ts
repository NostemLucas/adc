import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'

interface RequestWithUser extends Request {
  user?: {
    id: string
    email: string
    username?: string
  }
}

interface HttpExceptionResponse {
  statusCode?: number
  message?: string | string[]
  error?: string
}

/**
 * Global Exception Filter para todas las excepciones no manejadas
 * Registra todos los errores y devuelve respuestas consistentes
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<RequestWithUser>()
    const response = ctx.getResponse<Response>()

    // Obtener información del usuario si está autenticado
    const userContext = request.user
      ? {
          userId: request.user.id,
          userEmail: request.user.email,
          userName: request.user.username,
        }
      : undefined

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Error interno del servidor'
    const errorDetails: Record<string, unknown> = {}

    // Determinar tipo de excepción
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as HttpExceptionResponse
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : responseObj.message || message
        Object.assign(errorDetails, exceptionResponse)
      }
    } else if (exception instanceof Error) {
      message = exception.message
      errorDetails.name = exception.name
      errorDetails.stack = exception.stack
    } else if (typeof exception === 'string') {
      message = exception
    }

    // Log de la excepción con contexto completo
    const error = exception instanceof Error
      ? exception
      : new Error(typeof exception === 'string' ? exception : 'Unknown error')

    this.logger.logException(error, {
      req: request,
      user: userContext,
      additionalData: {
        statusCode: status,
        errorDetails,
      },
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

