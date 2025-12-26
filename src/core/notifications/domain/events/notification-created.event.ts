import { IEvent } from '@nestjs/cqrs'
import { NotificationType } from '../notification-type.enum'

export class NotificationCreatedEvent implements IEvent {
  constructor(
    public readonly notificationId: string,
    public readonly recipientId: string,
    public readonly type: NotificationType,
    public readonly title: string,
  ) {}
}
