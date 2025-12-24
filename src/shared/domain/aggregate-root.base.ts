import { IEvent } from '@nestjs/cqrs'

/**
 * Clase base para Agregados que emiten eventos de dominio.
 * Implementa el patrón Aggregate Root de DDD.
 */
export abstract class AggregateRoot {
  private _domainEvents: IEvent[] = []

  /**
   * Obtiene todos los eventos de dominio no comprometidos.
   */
  get domainEvents(): IEvent[] {
    return this._domainEvents
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
