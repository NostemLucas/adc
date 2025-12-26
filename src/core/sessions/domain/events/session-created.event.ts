import { IEvent } from '@nestjs/cqrs'
import { Role } from 'src/core/auth/domain/authorization'

export class SessionCreatedEvent implements IEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly currentRole: Role,
  ) {}
}
