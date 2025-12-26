import { NotificationType } from './notification-type.enum'
import { User } from 'src/core/users/domain/user'
import { AggregateRoot } from '@shared/domain/aggregate-root.base'
import { NotificationCreatedEvent, NotificationReadEvent } from './events'

/**
 * Notification Domain Entity - Representa una notificación del sistema
 *
 * Hereda de AggregateRoot para obtener:
 * - Campos técnicos: id, createdAt, updatedAt, deletedAt
 * - Gestión de eventos de dominio
 * - Métodos: touch(), softDelete(), restore()
 */

/**
 * Metadata estructurada para notificaciones
 * Permite almacenar información contextual adicional
 */
export interface NotificationMetadata {
  /** ID de la entidad relacionada */
  entityId?: string
  /** Tipo de entidad */
  entityType?:
    | 'user'
    | 'audit'
    | 'document'
    | 'task'
    | 'report'
    | 'evaluation'
    | 'other'
  /** Acción que generó la notificación */
  action?: string
  /** ID de auditoría (si aplica) */
  auditId?: string
  /** ID de usuario (si aplica) */
  userId?: string
  /** ID de documento (si aplica) */
  documentId?: string
  /** ID de evaluación (si aplica) */
  evaluationId?: string
  /** Cualquier otro dato adicional */
  [key: string]: unknown
}

// ===== TIPOS PARA CONSTRUCTOR =====
interface NotificationConstructorProps {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  type: NotificationType
  title: string
  message: string
  link?: string | null
  metadata?: NotificationMetadata | null
  isRead: boolean
  readAt?: Date | null
  recipientId: string
  createdById?: string | null
  recipient?: User
  createdBy?: User | null
}

// ===== TIPOS PARA FACTORY METHOD =====
interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  recipientId: string
  link?: string | null
  metadata?: NotificationMetadata | null
  createdById?: string | null
}

export class Notification extends AggregateRoot {
  // Campos heredados de AggregateRoot:
  // - _id, _createdAt, _updatedAt, _deletedAt
  // - Getters: id, createdAt, updatedAt, deletedAt, isDeleted
  // - Métodos: touch(), softDelete(), restore()

  // ===== CAMPOS DE NEGOCIO =====
  private _type: NotificationType
  private _title: string
  private _message: string
  private _link: string | null
  private _metadata: NotificationMetadata | null
  private _isRead: boolean
  private _readAt: Date | null
  private _recipientId: string
  private _createdById: string | null

  // Relations (loaded on demand)
  private _recipient?: User
  private _createdBy?: User | null

  private constructor(props: NotificationConstructorProps) {
    super()

    // Asignar campos técnicos heredados
    this._id = props.id
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._deletedAt = props.deletedAt ?? null

    // Asignar campos de negocio
    this._type = props.type
    this._title = props.title
    this._message = props.message
    this._link = props.link ?? null
    this._metadata = props.metadata ?? null
    this._isRead = props.isRead
    this._readAt = props.readAt ?? null
    this._recipientId = props.recipientId
    this._createdById = props.createdById ?? null
    this._recipient = props.recipient
    this._createdBy = props.createdBy ?? null
  }

  // ===== GETTERS PÚBLICOS =====
  // id, createdAt, updatedAt, deletedAt, isDeleted → Heredados de AggregateRoot

  get type(): NotificationType {
    return this._type
  }

  get title(): string {
    return this._title
  }

  get message(): string {
    return this._message
  }

  get link(): string | null {
    return this._link
  }

  get metadata(): NotificationMetadata | null {
    return this._metadata
  }

  get isRead(): boolean {
    return this._isRead
  }

  get readAt(): Date | null {
    return this._readAt
  }

  get recipientId(): string {
    return this._recipientId
  }

  get createdById(): string | null {
    return this._createdById
  }

  get recipient(): User | undefined {
    return this._recipient
  }

  get createdBy(): User | null | undefined {
    return this._createdBy
  }

  // ===== GETTERS COMPUTADOS =====
  get isUnread(): boolean {
    return !this._isRead
  }

  // ===== MÉTODOS DE COMPORTAMIENTO =====
  markAsRead(): void {
    if (!this._isRead) {
      this._isRead = true
      this._readAt = new Date()
      this.touch()
      this.addDomainEvent(new NotificationReadEvent(this._id, this._recipientId))
    }
  }

  // ===== FACTORY METHOD: CREATE =====
  static create(data: CreateNotificationData): Notification {
    // Validaciones
    if (!data.title?.trim()) {
      throw new Error('El título es requerido')
    }

    if (!data.message?.trim()) {
      throw new Error('El mensaje es requerido')
    }

    if (!data.recipientId) {
      throw new Error('El destinatario es requerido')
    }

    const now = new Date()

    const notification = new Notification({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      type: data.type,
      title: data.title.trim(),
      message: data.message.trim(),
      link: data.link?.trim() || null,
      metadata: data.metadata || null,
      isRead: false,
      readAt: null,
      recipientId: data.recipientId,
      createdById: data.createdById || null,
    })

    // Emitir evento de creación
    notification.addDomainEvent(new NotificationCreatedEvent(
      notification._id,
      notification._recipientId,
      notification._type,
      notification._title,
    ))

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
    metadata?: NotificationMetadata | null
    isRead: boolean
    readAt?: Date | null
    recipientId: string
    createdById?: string | null
    recipient?: User
    createdBy?: User | null
  }): Notification {
    return new Notification({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      metadata: data.metadata,
      isRead: data.isRead,
      readAt: data.readAt,
      recipientId: data.recipientId,
      createdById: data.createdById,
      recipient: data.recipient,
      createdBy: data.createdBy,
    })
  }
}
