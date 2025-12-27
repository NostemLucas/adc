import { IEvent } from '@nestjs/cqrs'

export abstract class AggregateRoot {
  protected _id!: string
  protected _createdAt!: Date
  protected _updatedAt!: Date
  protected _deletedAt: Date | null = null

  // ========== DOMAIN EVENTS ==========
  private _domainEvents: IEvent[] = []

  // ========== GETTERS TÉCNICOS ==========

  /**
   * Identificador único del agregado
   */
  get id(): string {
    return this._id
  }

  /**
   * Fecha de creación del agregado
   */
  get createdAt(): Date {
    return this._createdAt
  }

  /**
   * Fecha de última actualización del agregado
   */
  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Fecha de eliminación lógica (null si no está eliminado)
   */
  get deletedAt(): Date | null {
    return this._deletedAt
  }

  /**
   * Indica si el agregado fue eliminado lógicamente
   */
  get isDeleted(): boolean {
    return this._deletedAt !== null
  }

  // ========== MÉTODOS TÉCNICOS ==========

  /**
   * Actualiza el timestamp de modificación
   * Llamar este método cuando el agregado cambie
   */
  protected touch(): void {
    this._updatedAt = new Date()
  }

  /**
   * Realiza una eliminación lógica del agregado
   */
  softDelete(): void {
    if (this._deletedAt) {
      return // Ya está eliminado
    }
    this._deletedAt = new Date()
    this.touch()
  }

  /**
   * Restaura un agregado eliminado lógicamente
   */
  restore(): void {
    if (!this._deletedAt) {
      return // No está eliminado
    }
    this._deletedAt = null
    this.touch()
  }

  // ========== DOMAIN EVENTS ==========

  /**
   * Obtiene todos los eventos de dominio no comprometidos.
   * Retorna una copia para evitar modificaciones externas.
   */
  get domainEvents(): readonly IEvent[] {
    return [...this._domainEvents]
  }

  /**
   * Añade un evento de dominio a la lista de eventos no comprometidos.
   * @param event Evento de dominio a añadir
   */
  protected addDomainEvent(event: IEvent): void {
    this._domainEvents.push(event)
  }

  /**
   * Limpia todos los eventos de dominio no comprometidos.
   * Se llama después de publicar los eventos.
   */
  clearDomainEvents(): void {
    this._domainEvents = []
  }

  /**
   * Verifica si el agregado tiene eventos de dominio pendientes.
   */
  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0
  }
}
