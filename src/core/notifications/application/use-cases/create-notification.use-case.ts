import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../infrastructure/notification.repository'
import { Notification } from '../../domain/notification.entity'
import { CreateNotificationDto } from '../dto/create-notification.dto'

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    dto: CreateNotificationDto,
    createdById?: string,
  ): Promise<Notification> {
    const notification = Notification.create({
      type: dto.type,
      title: dto.title,
      message: dto.message,
      recipientId: dto.recipientId,
      link: dto.link,
      metadata: dto.metadata,
      createdById,
    })

    return await this.notificationRepository.create(notification)
  }
}
