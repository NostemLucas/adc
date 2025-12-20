import { NotificationType } from './notification-type.enum'
import { User } from 'src/core/users/domain/user.entity'

export interface NotificationMetadata {
  auditId?: string
  userId?: string
  documentId?: string
  evaluationId?: string
  action?: string
  [key: string]: any
}

export class Notification {
  // Base fields
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  // Notification fields
  type!: NotificationType
  title!: string
  message!: string
  link?: string | null
  metadata?: NotificationMetadata | null
  isRead!: boolean
  readAt?: Date | null
  recipientId!: string
  createdById?: string | null

  // Relations (loaded on demand)
  recipient?: User
  createdBy?: User | null

  private constructor() {}

  // ===== GETTERS =====
  get isUnread(): boolean {
    return !this.isRead
  }

  // ===== BUSINESS METHODS =====
  markAsRead(): void {
    if (!this.isRead) {
      this.isRead = true
      this.readAt = new Date()
    }
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: {
    type: NotificationType
    title: string
    message: string
    recipientId: string
    link?: string | null
    metadata?: NotificationMetadata | null
    createdById?: string | null
  }): Notification {
    // Validations
    if (!data.title?.trim()) {
      throw new Error('El título es requerido')
    }
    if (!data.message?.trim()) {
      throw new Error('El mensaje es requerido')
    }
    if (!data.recipientId) {
      throw new Error('El destinatario es requerido')
    }

    const notification = new Notification()
    notification.type = data.type
    notification.title = data.title.trim()
    notification.message = data.message.trim()
    notification.link = data.link?.trim() || null
    notification.metadata = data.metadata || null
    notification.isRead = false
    notification.readAt = null
    notification.recipientId = data.recipientId
    notification.createdById = data.createdById || null

    return notification
  }

  // ===== FACTORY METHOD: FROM PERSISTENCE =====
  static fromPersistence(data: {
    id: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    type: NotificationType
    title: string
    message: string
    link?: string | null
    metadata?: any
    isRead: boolean
    readAt?: Date | null
    recipientId: string
    createdById?: string | null
    recipient?: User
    createdBy?: User | null
  }): Notification {
    const notification = new Notification()

    notification.id = data.id
    notification.createdAt = data.createdAt
    notification.updatedAt = data.updatedAt
    notification.deletedAt = data.deletedAt || null
    notification.type = data.type
    notification.title = data.title
    notification.message = data.message
    notification.link = data.link || null
    notification.metadata = data.metadata || null
    notification.isRead = data.isRead
    notification.readAt = data.readAt || null
    notification.recipientId = data.recipientId
    notification.createdById = data.createdById || null
    notification.recipient = data.recipient
    notification.createdBy = data.createdBy || null

    return notification
  }
}
