import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'

/**
 * Contexto de la request actual.
 * Contiene información sobre el usuario autenticado y otros metadatos de la request.
 */
export interface RequestContextData {
  /** ID del usuario autenticado */
  userId?: string
  /** IP del cliente */
  ip?: string
  /** User agent */
  userAgent?: string
  /** Request ID para trazabilidad */
  requestId?: string
}

/**
 * Servicio para manejar el contexto de la request usando AsyncLocalStorage (CLS).
 *
 * Permite acceder al usuario autenticado y otros datos de la request
 * desde cualquier parte del código sin tener que pasarlos explícitamente.
 *
 * Esto es especialmente útil para:
 * - Auditoría automática (createdBy, updatedBy)
 * - Logging contextual
 * - Trazabilidad de requests
 *
 * @example
 * ```typescript
 * // En un interceptor o middleware
 * await this.requestContext.run({ userId: user.id }, async () => {
 *   // Toda la lógica de la request aquí
 * })
 *
 * // En cualquier repositorio o servicio
 * const userId = this.requestContext.getCurrentUserId()
 * ```
 */
@Injectable()
export class RequestContext {
  private readonly asyncLocalStorage =
    new AsyncLocalStorage<RequestContextData>()

  /**
   * Ejecuta una función con un contexto de request específico.
   *
   * @param context Datos del contexto de la request
   * @param fn Función a ejecutar dentro del contexto
   * @returns El resultado de la función ejecutada
   */
  run<T>(
    context: RequestContextData,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    return this.asyncLocalStorage.run(context, fn)
  }

  /**
   * Obtiene el contexto actual de la request.
   *
   * @returns Contexto actual o undefined si no hay uno activo
   */
  getContext(): RequestContextData | undefined {
    return this.asyncLocalStorage.getStore()
  }

  /**
   * Obtiene el ID del usuario autenticado actual.
   *
   * @returns ID del usuario o undefined si no hay usuario autenticado
   */
  getCurrentUserId(): string | undefined {
    return this.getContext()?.userId
  }

  /**
   * Obtiene el IP del cliente actual.
   *
   * @returns IP del cliente o undefined
   */
  getCurrentIp(): string | undefined {
    return this.getContext()?.ip
  }

  /**
   * Obtiene el User Agent del cliente actual.
   *
   * @returns User Agent o undefined
   */
  getCurrentUserAgent(): string | undefined {
    return this.getContext()?.userAgent
  }

  /**
   * Obtiene el Request ID actual.
   *
   * @returns Request ID o undefined
   */
  getCurrentRequestId(): string | undefined {
    return this.getContext()?.requestId
  }

  /**
   * Verifica si hay un contexto de request activo.
   *
   * @returns true si hay un contexto activo
   */
  isActive(): boolean {
    return this.asyncLocalStorage.getStore() !== undefined
  }
}
