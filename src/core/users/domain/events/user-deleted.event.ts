import { IEvent } from '@nestjs/cqrs'

/**
 * Evento de dominio que se emite cuando se elimina un usuario (soft delete).
 */
export class UserDeletedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly deletedAt: Date,
  ) {}
}
