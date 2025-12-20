import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../infrastructure/notification.repository'
import { Notification } from '../../domain/notification.entity'

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    recipientId: string,
    page: number = 1,
    limit: number = 20,
    onlyUnread: boolean = false,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const skip = (page - 1) * limit

    return await this.notificationRepository.findByRecipient(recipientId, {
      skip,
      take: limit,
      onlyUnread,
    })
  }
}
