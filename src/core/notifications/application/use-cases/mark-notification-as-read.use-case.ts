import { Injectable, NotFoundException } from '@nestjs/common'
import { NotificationRepository } from '../../infrastructure/notification.repository'
import { Notification } from '../../domain/notification.entity'

@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id)

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada')
    }

    // Verify ownership
    if (notification.recipientId !== userId) {
      throw new NotFoundException('Notificación no encontrada')
    }

    if (notification.isRead) {
      return notification // Already read
    }

    return await this.notificationRepository.markAsRead(id)
  }
}
