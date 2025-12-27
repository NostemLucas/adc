import { IEvent } from '@nestjs/cqrs'

export class SessionCreatedEvent implements IEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly currentRole: string,
  ) {}
}
