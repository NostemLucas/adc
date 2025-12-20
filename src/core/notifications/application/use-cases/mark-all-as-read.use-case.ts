import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../infrastructure/notification.repository'

@Injectable()
export class MarkAllAsReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.markAllAsRead(userId)
    return { count }
  }
}
