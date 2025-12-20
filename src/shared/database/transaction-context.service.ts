import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'async_hooks'
import { PrismaService } from './prisma.service'
import type { PrismaClientType } from './types'

/**
 * Servicio para manejar contexto de transacciones usando AsyncLocalStorage (CLS).
 *
 * Permite ejecutar código dentro de una transacción sin necesidad de pasar
 * explícitamente el cliente transaccional a cada método del repositorio.
 *
 * @example
 * ```typescript
 * await this.transactionContext.runInTransaction(async () => {
 *   // Todos los repositorios dentro de este callback usarán la misma transacción
 *   await this.userRepository.create(userData)
 *   await this.roleRepository.assignToUser(roleId, userId)
 *   // Si algo falla, todo se revierte automáticamente
 * })
 * ```
 */
@Injectable()
export class TransactionContext {
  private readonly asyncLocalStorage = new AsyncLocalStorage<PrismaClientType>()

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el cliente Prisma del contexto actual.
   *
   * Si hay una transacción activa en el contexto, retorna el cliente transaccional.
   * Si no, retorna el cliente Prisma normal.
   *
   * @returns Cliente Prisma (transaccional o normal)
   */
  getClient(): PrismaClientType {
    const transactionClient = this.asyncLocalStorage.getStore()
    return transactionClient ?? (this.prisma as PrismaClientType)
  }

  /**
   * Ejecuta una función dentro de una transacción Prisma.
   *
   * La transacción se almacena en el contexto usando AsyncLocalStorage,
   * permitiendo que todos los repositorios dentro del callback accedan
   * automáticamente a la transacción activa.
   *
   * Si ocurre un error, la transacción se revierte automáticamente.
   *
   * @param fn Función async a ejecutar dentro de la transacción
   * @returns El resultado de la función ejecutada
   *
   * @example
   * ```typescript
   * const result = await this.transactionContext.runInTransaction(async () => {
   *   const user = await this.userRepository.create(userData)
   *   await this.auditRepository.log({ action: 'USER_CREATED', userId: user.id })
   *   return user
   * })
   * ```
   */
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return this.asyncLocalStorage.run(tx as PrismaClientType, fn)
    })
  }

  /**
   * Verifica si actualmente hay una transacción activa en el contexto.
   *
   * @returns true si hay una transacción activa, false en caso contrario
   */
  isInTransaction(): boolean {
    return this.asyncLocalStorage.getStore() !== undefined
  }
}
