import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../infrastructure/notification.repository'

@Injectable()
export class GetUnreadCountUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.getUnreadCount(userId)
    return { count }
  }
}
