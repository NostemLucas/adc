import { Injectable } from '@nestjs/common'
import { Session as PrismaSession } from '@prisma/client'
import { PrismaService } from '@shared/database/prisma.service'
import { Session } from '../domain/session.entity'

/**
 * SessionRepository - Simple e independiente
 */
@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convierte Prisma Session a Domain Session
   */
  private toDomain(prismaSession: PrismaSession): Session {
    return Session.fromPersistence({
      id: prismaSession.id,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
      deletedAt: prismaSession.deletedAt,
      userId: prismaSession.userId,
      refreshToken: prismaSession.refreshToken,
      currentRole: prismaSession.currentRole,
      expiresAt: prismaSession.expiresAt,
      ipAddress: prismaSession.ipAddress,
      userAgent: prismaSession.userAgent,
      isActive: prismaSession.isActive,
      lastUsedAt: prismaSession.lastUsedAt,
    })
  }

  /**
   * Buscar por ID
   */
  async findById(id: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    })

    return session ? this.toDomain(session) : null
  }

  /**
   * Buscar por ID o lanzar excepción
   */
  async findByIdOrFail(id: string): Promise<Session> {
    const session = await this.findById(id)

    if (!session) {
      throw new Error(`Sesión con ID ${id} no encontrada`)
    }

    return session
  }

  /**
   * Buscar por refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken,
        isActive: true,
      },
    })

    return session ? this.toDomain(session) : null
  }

  /**
   * Buscar sesiones activas por usuario
   */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
    })

    return sessions.map((session) => this.toDomain(session))
  }

  /**
   * Crear sesión
   */
  async create(session: Session): Promise<Session> {
    const created = await this.prisma.session.create({
      data: {
        userId: session.userId,
        refreshToken: session.refreshToken,
        currentRole: session.currentRole,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
        lastUsedAt: session.lastUsedAt || new Date(),
      },
    })

    return this.toDomain(created)
  }

  /**
   * Actualizar sesión
   */
  async update(session: Session): Promise<Session> {
    const updated = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: session.refreshToken,
        currentRole: session.currentRole,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
        lastUsedAt: session.lastUsedAt,
      },
    })

    return this.toDomain(updated)
  }

  /**
   * Guardar (crear o actualizar)
   */
  async save(session: Session): Promise<Session> {
    if (session.id) {
      return this.update(session)
    } else {
      return this.create(session)
    }
  }

  /**
   * Invalidar sesión
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    })
  }

  /**
   * Invalidar todas las sesiones de un usuario
   */
  async invalidateAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: { isActive: false },
    })
  }

  /**
   * Eliminar sesiones expiradas
   */
  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false },
        ],
      },
    })

    return result.count
  }
}
