import { IEvent } from '@nestjs/cqrs'

export class SessionInvalidatedEvent implements IEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
  ) {}
}
