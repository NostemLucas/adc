import { IEvent } from '@nestjs/cqrs'

/**
 * Evento de dominio que se emite cuando se actualiza un usuario.
 */
export class UserUpdatedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly fullName: string,
    public readonly updatedFields: string[],
    public readonly updatedAt: Date,
  ) {}
}
