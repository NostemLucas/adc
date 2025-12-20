import { OtpType } from '@prisma/client'

interface OtpPersistenceData {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  userId: string
  code: string
  type: OtpType
  expiresAt: Date
  isUsed: boolean
  usedAt: Date | null
  attempts: number
}

interface CreateOtpData {
  userId: string
  code: string
  type: OtpType
  expiresAt: Date
}

/**
 * OTP Entity - One-Time Password para 2FA y recuperación de contraseña
 */
export class Otp {
  private constructor(
    public readonly id: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly userId: string,
    public code: string,
    public readonly type: OtpType,
    public readonly expiresAt: Date,
    public isUsed: boolean,
    public usedAt: Date | null,
    public attempts: number,
  ) {}

  /**
   * Factory method para crear un nuevo OTP
   */
  static create(data: CreateOtpData): Otp {
    return new Otp(
      '', // ID será generado por Prisma
      new Date(),
      new Date(),
      null,
      data.userId,
      data.code,
      data.type,
      data.expiresAt,
      false,
      null,
      0,
    )
  }

  /**
   * Factory method para reconstruir desde persistencia
   */
  static fromPersistence(data: OtpPersistenceData): Otp {
    return new Otp(
      data.id,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
      data.userId,
      data.code,
      data.type,
      data.expiresAt,
      data.isUsed,
      data.usedAt,
      data.attempts,
    )
  }

  /**
   * Verifica si el OTP está expirado
   */
  get isExpired(): boolean {
    return this.expiresAt < new Date()
  }

  /**
   * Verifica si el OTP es válido (no usado y no expirado)
   */
  get isValid(): boolean {
    return !this.isUsed && !this.isExpired && !this.deletedAt
  }

  /**
   * Marca el OTP como usado
   */
  markAsUsed(): void {
    this.isUsed = true
    this.usedAt = new Date()
  }

  /**
   * Incrementa los intentos de uso
   */
  incrementAttempts(): void {
    this.attempts += 1
  }

  /**
   * Verifica si se excedió el número máximo de intentos
   */
  hasExceededMaxAttempts(maxAttempts: number = 3): boolean {
    return this.attempts >= maxAttempts
  }
}
