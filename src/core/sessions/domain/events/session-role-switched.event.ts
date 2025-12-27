import { IEvent } from '@nestjs/cqrs'

export class SessionRoleSwitchedEvent implements IEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly previousRole: string,
    public readonly newRole: string,
  ) {}
}
