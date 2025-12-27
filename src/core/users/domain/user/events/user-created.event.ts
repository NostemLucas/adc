import { IEvent } from '@nestjs/cqrs'
import { UserType } from '../../shared/constants'

/**
 * Evento de dominio que se emite cuando se crea un nuevo usuario.
 * Representa un hecho que ya ocurrió en el dominio.
 */
export class UserCreatedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly fullName: string,
    public readonly type: UserType,
    public readonly createdAt: Date,
  ) {}
}
