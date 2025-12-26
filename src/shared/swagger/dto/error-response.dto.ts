import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para errores 400 Bad Request
 */
export class BadRequestErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number

  @ApiProperty({
    example: 'Datos de entrada inválidos',
    description: 'Mensaje descriptivo del error de validación',
  })
  message!: string

  @ApiProperty({ example: 'Bad Request' })
  error!: string
}

/**
 * DTO para errores 401 Unauthorized
 */
export class UnauthorizedErrorDto {
  @ApiProperty({ example: 401 })
  statusCode!: number

  @ApiProperty({
    example: 'No autorizado',
    description: 'El usuario no está autenticado o el token es inválido',
  })
  message!: string

  @ApiProperty({ example: 'Unauthorized' })
  error!: string
}

/**
 * DTO para errores 403 Forbidden
 */
export class ForbiddenErrorDto {
  @ApiProperty({ example: 403 })
  statusCode!: number

  @ApiProperty({
    example: 'Acceso denegado',
    description: 'El usuario no tiene permisos para acceder a este recurso',
  })
  message!: string

  @ApiProperty({ example: 'Forbidden' })
  error!: string
}

/**
 * DTO para errores 404 Not Found
 */
export class NotFoundErrorDto {
  @ApiProperty({ example: 404 })
  statusCode!: number

  @ApiProperty({
    example: 'Recurso no encontrado',
    description: 'El recurso solicitado no existe',
  })
  message!: string

  @ApiProperty({ example: 'Not Found' })
  error!: string
}

/**
 * DTO para errores 409 Conflict
 */
export class ConflictErrorDto {
  @ApiProperty({ example: 409 })
  statusCode!: number

  @ApiProperty({
    example: 'El recurso ya existe',
    description: 'Conflicto con el estado actual del recurso',
  })
  message!: string

  @ApiProperty({ example: 'Conflict' })
  error!: string
}

/**
 * DTO para errores 500 Internal Server Error
 */
export class InternalServerErrorDto {
  @ApiProperty({ example: 500 })
  statusCode!: number

  @ApiProperty({
    example: 'Error interno del servidor',
    description: 'Ha ocurrido un error inesperado',
  })
  message!: string

  @ApiProperty({ example: 'Internal Server Error' })
  error!: string
}
