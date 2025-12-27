import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'
import { DomainException } from '@shared/domain'
import {
  InvalidEmailFormatException,
  InvalidCiFormatException,
  InvalidPhoneFormatException,
  InvalidPasswordException,
  EmptyFieldException,
  MissingRolesException,
  ExclusiveRoleViolationException,
  RoleNotFoundException,
  DuplicateEmailException,
  DuplicateUsernameException,
  DuplicateCiException,
  InvalidUserDataException,
} from 'src/core/users/domain/user/exceptions'

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

  /**
   * Mapea excepciones de dominio a status HTTP apropiados
   */
  private mapDomainExceptionToHttpStatus(exception: DomainException): number {
    // Validaciones de formato → 400 BAD REQUEST
    if (
      exception instanceof InvalidEmailFormatException ||
      exception instanceof InvalidCiFormatException ||
      exception instanceof InvalidPhoneFormatException ||
      exception instanceof InvalidPasswordException ||
      exception instanceof EmptyFieldException ||
      exception instanceof MissingRolesException ||
      exception instanceof ExclusiveRoleViolationException ||
      exception instanceof InvalidUserDataException
    ) {
      return HttpStatus.BAD_REQUEST
    }

    // Duplicados → 409 CONFLICT
    if (
      exception instanceof DuplicateEmailException ||
      exception instanceof DuplicateUsernameException ||
      exception instanceof DuplicateCiException
    ) {
      return HttpStatus.CONFLICT
    }

    // No encontrado → 404 NOT FOUND
    if (exception instanceof RoleNotFoundException) {
      return HttpStatus.NOT_FOUND
    }

    // Por defecto, error interno (esto no debería pasar)
    return HttpStatus.INTERNAL_SERVER_ERROR
  }

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
      // Excepciones HTTP de NestJS (BadRequestException, NotFoundException, etc.)
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
    } else if (exception instanceof DomainException) {
      // Excepciones del dominio (InvalidEmailFormatException, DuplicateEmailException, etc.)
      status = this.mapDomainExceptionToHttpStatus(exception)
      message = exception.message
      errorDetails.code = exception.code
      errorDetails.name = exception.name
    } else if (exception instanceof Error) {
      // Otros errores genéricos
      message = exception.message
      errorDetails.name = exception.name
      errorDetails.stack = exception.stack
    } else if (typeof exception === 'string') {
      message = exception
    }

    // Log de la excepción con contexto completo
    const error =
      exception instanceof Error
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
