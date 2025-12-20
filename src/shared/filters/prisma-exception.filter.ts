import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { LoggerService } from '../logger/logger.service'

interface RequestWithUser extends Request {
  user?: {
    id: string
    email: string
    username?: string
  }
}

/**
 * Global Exception Filter para errores de Prisma
 * Convierte errores técnicos en respuestas user-friendly
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ): void {
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

    // Log del error de base de datos con contexto completo
    const operation = `${request.method} ${request.url}`
    this.logger.logDatabaseError(exception, operation, {
      user: userContext,
    })

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Error en la base de datos'

    // Prisma Known Request Errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const error = this.handleKnownError(exception)
      status = error.status
      message = error.message
    }

    // Prisma Validation Errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST
      message = 'Datos inválidos proporcionados'
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    })
  }

  private handleKnownError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number
    message: string
  } {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = (exception.meta?.target as string[])?.[0] || 'campo'
        return {
          status: HttpStatus.CONFLICT,
          message: `Ya existe un registro con este ${field}`,
        }
      }

      case 'P2025': {
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro no encontrado',
        }
      }

      case 'P2003': {
        // Foreign key constraint violation
        return {
          status: HttpStatus.CONFLICT,
          message:
            'No se puede eliminar porque está relacionado con otros registros',
        }
      }

      case 'P2014': {
        // Invalid relation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Relación inválida entre entidades',
        }
      }

      default: {
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error inesperado en la base de datos',
        }
      }
    }
  }
}
