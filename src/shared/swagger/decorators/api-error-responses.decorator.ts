import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import {
  BadRequestErrorDto,
  UnauthorizedErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  ConflictErrorDto,
  InternalServerErrorDto,
} from '../dto/error-response.dto'

/**
 * Decorador para respuesta 400 Bad Request
 * @param description Descripción personalizada del error
 * @param example Ejemplo personalizado del mensaje de error
 */
export const ApiBadRequestResponse = (
  description?: string,
  example?: string,
) => {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: description || 'Datos de entrada inválidos',
      type: BadRequestErrorDto,
      ...(example && {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example },
            error: { type: 'string', example: 'Bad Request' },
          },
        },
      }),
    }),
  )
}

/**
 * Decorador para respuesta 401 Unauthorized
 * @param description Descripción personalizada del error
 * @param example Ejemplo personalizado del mensaje de error
 */
export const ApiUnauthorizedResponse = (
  description?: string,
  example?: string,
) => {
  return applyDecorators(
    ApiResponse({
      status: 401,
      description: description || 'No autorizado',
      type: UnauthorizedErrorDto,
      ...(example && {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      }),
    }),
  )
}

/**
 * Decorador para respuesta 403 Forbidden
 * @param description Descripción personalizada del error
 * @param example Ejemplo personalizado del mensaje de error
 */
export const ApiForbiddenResponse = (
  description?: string,
  example?: string,
) => {
  return applyDecorators(
    ApiResponse({
      status: 403,
      description: description || 'Acceso denegado',
      type: ForbiddenErrorDto,
      ...(example && {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      }),
    }),
  )
}

/**
 * Decorador para respuesta 404 Not Found
 * @param description Descripción personalizada del error
 * @param example Ejemplo personalizado del mensaje de error
 */
export const ApiNotFoundResponse = (description?: string, example?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 404,
      description: description || 'Recurso no encontrado',
      type: NotFoundErrorDto,
      ...(example && {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: { type: 'string', example },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      }),
    }),
  )
}

/**
 * Decorador para respuesta 409 Conflict
 * @param description Descripción personalizada del error
 * @param example Ejemplo personalizado del mensaje de error
 */
export const ApiConflictResponse = (description?: string, example?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 409,
      description: description || 'Conflicto con el estado actual del recurso',
      type: ConflictErrorDto,
      ...(example && {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: { type: 'string', example },
            error: { type: 'string', example: 'Conflict' },
          },
        },
      }),
    }),
  )
}

/**
 * Decorador para respuesta 500 Internal Server Error
 * @param description Descripción personalizada del error
 * @param example Ejemplo personalizado del mensaje de error
 */
export const ApiInternalServerErrorResponse = (
  description?: string,
  example?: string,
) => {
  return applyDecorators(
    ApiResponse({
      status: 500,
      description: description || 'Error interno del servidor',
      type: InternalServerErrorDto,
      ...(example && {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 500 },
            message: { type: 'string', example },
            error: { type: 'string', example: 'Internal Server Error' },
          },
        },
      }),
    }),
  )
}

/**
 * Decorador compuesto para endpoints que requieren autenticación
 * Aplica respuestas 401 Unauthorized por defecto
 */
export const ApiAuthResponses = () => {
  return applyDecorators(ApiUnauthorizedResponse())
}

/**
 * Decorador compuesto para endpoints CRUD estándar
 * Aplica respuestas comunes: 400, 401, 404, 500
 */
export const ApiCrudResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse(),
    ApiUnauthorizedResponse(),
    ApiNotFoundResponse(),
    ApiInternalServerErrorResponse(),
  )
}
