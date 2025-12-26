import { Notification, NotificationMetadata } from './notification.entity'
import { NotificationType } from './notification-type.enum'
import { NotificationCreatedEvent, NotificationReadEvent } from './events'

describe('Notification Entity', () => {
  const validNotificationData = {
    type: NotificationType.INFO,
    title: 'Nueva tarea asignada',
    message: 'Se te ha asignado una nueva tarea de auditoría',
    recipientId: 'user-123',
    link: '/tasks/456',
    metadata: {
      entityId: 'task-456',
      entityType: 'task' as const,
      action: 'assigned',
    },
    createdById: 'admin-789',
  }

  describe('create', () => {
    it('debe crear una notificación con datos válidos', () => {
      const notification = Notification.create(validNotificationData)

      expect(notification).toBeInstanceOf(Notification)
      expect(notification.type).toBe(NotificationType.INFO)
      expect(notification.title).toBe('Nueva tarea asignada')
      expect(notification.message).toBe(
        'Se te ha asignado una nueva tarea de auditoría',
      )
      expect(notification.recipientId).toBe('user-123')
      expect(notification.link).toBe('/tasks/456')
      expect(notification.isRead).toBe(false)
      expect(notification.readAt).toBeNull()
      expect(notification.createdById).toBe('admin-789')
    })

    it('debe crear notificación sin campos opcionales', () => {
      const minimalData = {
        type: NotificationType.SUCCESS,
        title: 'Operación exitosa',
        message: 'La operación se completó correctamente',
        recipientId: 'user-456',
      }

      const notification = Notification.create(minimalData)

      expect(notification.link).toBeNull()
      expect(notification.metadata).toBeNull()
      expect(notification.createdById).toBeNull()
    })

    it('debe lanzar error si falta el título', () => {
      const invalidData = { ...validNotificationData, title: '' }

      expect(() => Notification.create(invalidData)).toThrow(
        'El título es requerido',
      )
    })

    it('debe lanzar error si falta el mensaje', () => {
      const invalidData = { ...validNotificationData, message: '   ' }

      expect(() => Notification.create(invalidData)).toThrow(
        'El mensaje es requerido',
      )
    })

    it('debe lanzar error si falta el recipientId', () => {
      const invalidData = { ...validNotificationData, recipientId: '' }

      expect(() => Notification.create(invalidData)).toThrow(
        'El destinatario es requerido',
      )
    })

    it('debe trimear título y mensaje', () => {
      const dataWithSpaces = {
        ...validNotificationData,
        title: '  Título con espacios  ',
        message: '  Mensaje con espacios  ',
      }

      const notification = Notification.create(dataWithSpaces)

      expect(notification.title).toBe('Título con espacios')
      expect(notification.message).toBe('Mensaje con espacios')
    })

    it('debe emitir NotificationCreatedEvent al crear', () => {
      const notification = Notification.create(validNotificationData)

      expect(notification.hasDomainEvents()).toBe(true)
      const events = notification.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(NotificationCreatedEvent)
      const event = events[0] as NotificationCreatedEvent
      expect(event.notificationId).toBeDefined()
      expect(event.recipientId).toBe('user-123')
      expect(event.type).toBe(NotificationType.INFO)
      expect(event.title).toBe('Nueva tarea asignada')
    })
  })

  describe('fromPersistence', () => {
    it('debe crear notificación desde datos de persistencia', () => {
      const persistenceData = {
        id: 'notification-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        type: NotificationType.WARNING,
        title: 'Advertencia',
        message: 'Esto es una advertencia',
        link: '/warning',
        metadata: { action: 'warning' },
        isRead: false,
        readAt: null,
        recipientId: 'user-789',
        createdById: 'system',
      }

      const notification = Notification.fromPersistence(persistenceData)

      expect(notification.id).toBe('notification-123')
      expect(notification.type).toBe(NotificationType.WARNING)
      expect(notification.title).toBe('Advertencia')
      expect(notification.recipientId).toBe('user-789')
    })
  })

  describe('getters', () => {
    let notification: Notification

    beforeEach(() => {
      notification = Notification.create(validNotificationData)
    })

    it('isUnread debe retornar true para notificación no leída', () => {
      expect(notification.isUnread).toBe(true)
    })

    it('isUnread debe retornar false para notificación leída', () => {
      notification.markAsRead()
      expect(notification.isUnread).toBe(false)
    })

    it('debe retornar metadata correctamente', () => {
      expect(notification.metadata).toEqual({
        entityId: 'task-456',
        entityType: 'task',
        action: 'assigned',
      })
    })
  })

  describe('markAsRead', () => {
    it('debe marcar la notificación como leída', () => {
      const notification = Notification.create(validNotificationData)

      expect(notification.isRead).toBe(false)
      expect(notification.readAt).toBeNull()

      notification.markAsRead()

      expect(notification.isRead).toBe(true)
      expect(notification.readAt).toBeInstanceOf(Date)
    })

    it('no debe cambiar si ya está leída', () => {
      const notification = Notification.create(validNotificationData)
      notification.markAsRead()

      const firstReadAt = notification.readAt

      // Esperar un poco
      jest.useFakeTimers()
      jest.advanceTimersByTime(1000)

      notification.markAsRead()

      expect(notification.readAt).toEqual(firstReadAt)

      jest.useRealTimers()
    })

    it('debe emitir NotificationReadEvent', () => {
      const notification = Notification.create(validNotificationData)
      notification.clearDomainEvents() // Limpiar evento de creación

      notification.markAsRead()

      const events = notification.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(NotificationReadEvent)
      const event = events[0] as NotificationReadEvent
      expect(event.recipientId).toBe('user-123')
    })

    it('no debe emitir evento si ya está leída', () => {
      const notification = Notification.create(validNotificationData)
      notification.markAsRead()
      notification.clearDomainEvents()

      notification.markAsRead()

      expect(notification.hasDomainEvents()).toBe(false)
    })
  })

  describe('tipos de notificación', () => {
    it('debe soportar tipo INFO', () => {
      const notification = Notification.create({
        ...validNotificationData,
        type: NotificationType.INFO,
      })
      expect(notification.type).toBe(NotificationType.INFO)
    })

    it('debe soportar tipo SUCCESS', () => {
      const notification = Notification.create({
        ...validNotificationData,
        type: NotificationType.SUCCESS,
      })
      expect(notification.type).toBe(NotificationType.SUCCESS)
    })

    it('debe soportar tipo WARNING', () => {
      const notification = Notification.create({
        ...validNotificationData,
        type: NotificationType.WARNING,
      })
      expect(notification.type).toBe(NotificationType.WARNING)
    })

    it('debe soportar tipo ERROR', () => {
      const notification = Notification.create({
        ...validNotificationData,
        type: NotificationType.ERROR,
      })
      expect(notification.type).toBe(NotificationType.ERROR)
    })
  })

  describe('metadata', () => {
    it('debe almacenar metadata estructurada', () => {
      const metadata: NotificationMetadata = {
        entityId: 'audit-789',
        entityType: 'audit',
        action: 'completed',
        auditId: 'audit-789',
        customField: 'custom value',
      }

      const notification = Notification.create({
        ...validNotificationData,
        metadata,
      })

      expect(notification.metadata).toEqual(metadata)
      expect(notification.metadata?.entityId).toBe('audit-789')
      expect(notification.metadata?.entityType).toBe('audit')
      expect(notification.metadata?.customField).toBe('custom value')
    })
  })

  describe('campos técnicos heredados', () => {
    it('debe tener id, createdAt, updatedAt', () => {
      const notification = Notification.create(validNotificationData)

      expect(notification.id).toBeDefined()
      expect(notification.createdAt).toBeInstanceOf(Date)
      expect(notification.updatedAt).toBeInstanceOf(Date)
      expect(notification.deletedAt).toBeNull()
      expect(notification.isDeleted).toBe(false)
    })

    it('softDelete debe marcar como eliminado', () => {
      const notification = Notification.create(validNotificationData)

      notification.softDelete()

      expect(notification.isDeleted).toBe(true)
      expect(notification.deletedAt).toBeInstanceOf(Date)
    })

    it('restore debe restaurar notificación eliminada', () => {
      const notification = Notification.create(validNotificationData)
      notification.softDelete()

      notification.restore()

      expect(notification.isDeleted).toBe(false)
      expect(notification.deletedAt).toBeNull()
    })
  })
})
