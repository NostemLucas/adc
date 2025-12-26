import { Session } from './session.entity'
import { Role } from 'src/core/auth/domain/authorization'
import {
  SessionCreatedEvent,
  SessionInvalidatedEvent,
  SessionRoleSwitchedEvent,
} from './events'

describe('Session Entity', () => {
  const validSessionData = {
    userId: 'user-123',
    refreshToken: 'valid-refresh-token-abc123',
    currentRole: Role.ADMINISTRADOR,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
  }

  describe('create', () => {
    it('debe crear una sesión con datos válidos', () => {
      const session = Session.create(validSessionData)

      expect(session).toBeInstanceOf(Session)
      expect(session.userId).toBe('user-123')
      expect(session.refreshToken).toBe('valid-refresh-token-abc123')
      expect(session.currentRole).toBe(Role.ADMINISTRADOR)
      expect(session.isActive).toBe(true)
      expect(session.ipAddress).toBe('192.168.1.1')
      expect(session.userAgent).toBe('Mozilla/5.0')
      expect(session.lastUsedAt).toBeInstanceOf(Date)
    })

    it('debe crear sesión sin ipAddress y userAgent (opcionales)', () => {
      const dataWithoutOptionals = {
        userId: 'user-123',
        refreshToken: 'token',
        currentRole: Role.GERENTE,
        expiresAt: new Date(Date.now() + 1000000),
      }

      const session = Session.create(dataWithoutOptionals)

      expect(session.ipAddress).toBeNull()
      expect(session.userAgent).toBeNull()
    })

    it('debe lanzar error si falta userId', () => {
      const invalidData = { ...validSessionData, userId: '' }

      expect(() => Session.create(invalidData)).toThrow(
        'El ID de usuario es requerido',
      )
    })

    it('debe lanzar error si falta refreshToken', () => {
      const invalidData = { ...validSessionData, refreshToken: '   ' }

      expect(() => Session.create(invalidData)).toThrow(
        'El refresh token es requerido',
      )
    })

    it('debe lanzar error si falta currentRole', () => {
      const invalidData = { ...validSessionData, currentRole: null as any }

      expect(() => Session.create(invalidData)).toThrow(
        'El rol activo es requerido',
      )
    })

    it('debe lanzar error si expiresAt es en el pasado', () => {
      const invalidData = {
        ...validSessionData,
        expiresAt: new Date(Date.now() - 1000),
      }

      expect(() => Session.create(invalidData)).toThrow(
        'La fecha de expiración debe ser futura',
      )
    })

    it('debe emitir SessionCreatedEvent al crear', () => {
      const session = Session.create(validSessionData)

      expect(session.hasDomainEvents()).toBe(true)
      const events = session.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(SessionCreatedEvent)
      expect((events[0] as SessionCreatedEvent).userId).toBe('user-123')
      expect((events[0] as SessionCreatedEvent).currentRole).toBe(
        Role.ADMINISTRADOR,
      )
    })
  })

  describe('fromPersistence', () => {
    it('debe crear sesión desde datos de persistencia', () => {
      const persistenceData = {
        id: 'session-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        userId: 'user-456',
        refreshToken: 'token-from-db',
        currentRole: 'GERENTE',
        expiresAt: new Date(Date.now() + 1000000),
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome',
        isActive: true,
        lastUsedAt: new Date(),
      }

      const session = Session.fromPersistence(persistenceData)

      expect(session.id).toBe('session-123')
      expect(session.userId).toBe('user-456')
      expect(session.currentRole).toBe('GERENTE')
      expect(session.isActive).toBe(true)
    })
  })

  describe('getters', () => {
    let session: Session

    beforeEach(() => {
      session = Session.create(validSessionData)
    })

    it('isExpired debe retornar false para sesión no expirada', () => {
      expect(session.isExpired).toBe(false)
    })

    it('isExpired debe retornar true para sesión expirada', () => {
      const expiredSession = Session.fromPersistence({
        id: 'session-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        refreshToken: 'token',
        currentRole: 'ADMINISTRADOR',
        expiresAt: new Date(Date.now() - 1000), // Expired
        isActive: true,
        ipAddress: null,
        userAgent: null,
        lastUsedAt: new Date(),
      })

      expect(expiredSession.isExpired).toBe(true)
    })

    it('isValid debe retornar true si está activa y no expirada', () => {
      expect(session.isValid).toBe(true)
    })

    it('isValid debe retornar false si está inactiva', () => {
      session.invalidate()
      expect(session.isValid).toBe(false)
    })

    it('isValid debe retornar false si está expirada', () => {
      const expiredSession = Session.fromPersistence({
        id: 'session-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        refreshToken: 'token',
        currentRole: 'ADMINISTRADOR',
        expiresAt: new Date(Date.now() - 1000),
        isActive: true,
        ipAddress: null,
        userAgent: null,
        lastUsedAt: new Date(),
      })

      expect(expiredSession.isValid).toBe(false)
    })
  })

  describe('invalidate', () => {
    it('debe invalidar la sesión', () => {
      const session = Session.create(validSessionData)

      session.invalidate()

      expect(session.isActive).toBe(false)
      expect(session.isValid).toBe(false)
    })

    it('debe emitir SessionInvalidatedEvent', () => {
      const session = Session.create(validSessionData)
      session.clearDomainEvents() // Limpiar el evento de creación

      session.invalidate()

      const events = session.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(SessionInvalidatedEvent)
    })
  })

  describe('updateLastUsed', () => {
    it('debe actualizar lastUsedAt', () => {
      const session = Session.create(validSessionData)
      const originalLastUsed = session.lastUsedAt

      // Esperar un poco para que la fecha cambie
      jest.useFakeTimers()
      jest.advanceTimersByTime(1000)

      session.updateLastUsed()

      expect(session.lastUsedAt).not.toEqual(originalLastUsed)
      expect(session.lastUsedAt).toBeInstanceOf(Date)

      jest.useRealTimers()
    })
  })

  describe('switchRole', () => {
    it('debe cambiar el rol actual', () => {
      const session = Session.create(validSessionData)

      expect(session.currentRole).toBe(Role.ADMINISTRADOR)

      session.switchRole(Role.GERENTE)

      expect(session.currentRole).toBe(Role.GERENTE)
    })

    it('debe emitir SessionRoleSwitchedEvent', () => {
      const session = Session.create(validSessionData)
      session.clearDomainEvents()

      session.switchRole(Role.AUDITOR)

      const events = session.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(SessionRoleSwitchedEvent)
      const event = events[0] as SessionRoleSwitchedEvent
      expect(event.previousRole).toBe(Role.ADMINISTRADOR)
      expect(event.newRole).toBe(Role.AUDITOR)
    })
  })

  describe('campos técnicos heredados', () => {
    it('debe tener id, createdAt, updatedAt', () => {
      const session = Session.create(validSessionData)

      expect(session.id).toBeDefined()
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.updatedAt).toBeInstanceOf(Date)
      expect(session.deletedAt).toBeNull()
      expect(session.isDeleted).toBe(false)
    })

    it('softDelete debe marcar como eliminado', () => {
      const session = Session.create(validSessionData)

      session.softDelete()

      expect(session.isDeleted).toBe(true)
      expect(session.deletedAt).toBeInstanceOf(Date)
    })

    it('restore debe restaurar sesión eliminada', () => {
      const session = Session.create(validSessionData)
      session.softDelete()

      session.restore()

      expect(session.isDeleted).toBe(false)
      expect(session.deletedAt).toBeNull()
    })
  })
})
