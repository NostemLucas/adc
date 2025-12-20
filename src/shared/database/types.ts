import { PrismaService } from './prisma.service'

/**
 * Tipo que representa un cliente Prisma que puede ser normal o transaccional.
 *
 * Omite los métodos que no están disponibles en contexto transaccional
 * para garantizar type-safety.
 */
export type PrismaClientType = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>
