import { IEvent } from '@nestjs/cqrs'

export class NotificationReadEvent implements IEvent {
  constructor(
    public readonly notificationId: string,
    public readonly recipientId: string,
  ) {}
}
