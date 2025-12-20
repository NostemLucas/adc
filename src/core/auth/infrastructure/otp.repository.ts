import { Injectable } from '@nestjs/common'
import { OtpType } from '@prisma/client'
import { BaseRepository, TransactionContext } from '@shared/database'
import { Otp } from '../domain/otp.entity'

/**
 * OtpRepository - Repositorio para gestionar OTPs (2FA, Password Reset, etc.)
 */
@Injectable()
export class OtpRepository extends BaseRepository {
  constructor(transactionContext: TransactionContext) {
    super(transactionContext)
  }

  /**
   * Crea un nuevo OTP
   */
  async create(otp: Otp): Promise<Otp> {
    const created = await this.prisma.otp.create({
      data: {
        userId: otp.userId,
        code: otp.code,
        type: otp.type,
        expiresAt: otp.expiresAt,
        isUsed: otp.isUsed,
        attempts: otp.attempts,
      },
    })

    return Otp.fromPersistence(created)
  }

  /**
   * Busca un OTP por código y tipo
   */
  async findByCodeAndType(code: string, type: OtpType): Promise<Otp | null> {
    const otp = await this.prisma.otp.findFirst({
      where: {
        code,
        type,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return otp ? Otp.fromPersistence(otp) : null
  }

  /**
   * Busca OTPs válidos (no usados, no expirados) por usuario y tipo
   */
  async findValidByUserAndType(userId: string, type: OtpType): Promise<Otp[]> {
    const otps = await this.prisma.otp.findMany({
      where: {
        userId,
        type,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return otps.map((otp) => Otp.fromPersistence(otp))
  }

  /**
   * Guarda cambios en un OTP existente
   */
  async save(otp: Otp): Promise<Otp> {
    const updated = await this.prisma.otp.update({
      where: { id: otp.id },
      data: {
        isUsed: otp.isUsed,
        usedAt: otp.usedAt,
        attempts: otp.attempts,
      },
    })

    return Otp.fromPersistence(updated)
  }

  /**
   * Invalida todos los OTPs de un usuario por tipo
   */
  async invalidateAllByUserAndType(userId: string, type: OtpType): Promise<void> {
    await this.prisma.otp.updateMany({
      where: {
        userId,
        type,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    })
  }

  /**
   * Elimina OTPs expirados (cleanup)
   */
  async deleteExpired(): Promise<number> {
    const result = await this.prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    return result.count
  }
}
