import { Injectable } from '@nestjs/common'
import { NotificationsGateway } from '../../infrastructure/notifications.gateway'
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case'
import { NotificationType } from '../../domain/notification-type.enum'
import { NotificationResponseDto } from '../dto/notification-response.dto'
import {
  Notification,
  NotificationMetadata,
} from '../../domain/notification.entity'
import { UserRepository } from 'src/core/users/infrastructure/user.repository'

export interface NotifyAdminsParams {
  title: string
  message: string
  link?: string
  metadata?: NotificationMetadata
  createdById?: string
}

export interface NotifyManagersAuditorsParams {
  title: string
  message: string
  link?: string
  metadata?: NotificationMetadata
  createdById?: string
}

export interface NotifyUserParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: NotificationMetadata
  createdById?: string
}

@Injectable()
export class NotificationBroadcastService {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly userRepository: UserRepository,
  ) {}

  private toResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    }
  }

  async notifyAdmins(params: NotifyAdminsParams): Promise<void> {
    // Get all admin users
    const admins = await this.userRepository.findByRole('administrador')

    // Create and broadcast notifications to each admin
    for (const admin of admins) {
      const notification = await this.createNotificationUseCase.execute(
        {
          type: NotificationType.INFO,
          title: params.title,
          message: params.message,
          recipientId: admin.id,
          link: params.link,
          metadata: params.metadata,
        },
        params.createdById,
      )

      // Emit to admin room (all admins)
      this.notificationsGateway.emitToAdmins(
        this.toResponseDto(notification),
      )
    }
  }

  async notifyManagersAndAuditors(
    params: NotifyManagersAuditorsParams,
  ): Promise<void> {
    // Get all manager and auditor users
    const managers = await this.userRepository.findByRole('gerente')
    const auditors = await this.userRepository.findByRole('auditor')
    const users = [...managers, ...auditors]

    // Create notifications for each user and broadcast
    for (const user of users) {
      const notification = await this.createNotificationUseCase.execute(
        {
          type: NotificationType.INFO,
          title: params.title,
          message: params.message,
          recipientId: user.id,
          link: params.link,
          metadata: params.metadata,
        },
        params.createdById,
      )

      // Emit to manager-auditor room (all will receive)
      this.notificationsGateway.emitToManagersAndAuditors(
        this.toResponseDto(notification),
      )
    }
  }

  async notifyUser(params: NotifyUserParams): Promise<void> {
    // Create notification in database
    const notification = await this.createNotificationUseCase.execute(
      {
        type: params.type,
        title: params.title,
        message: params.message,
        recipientId: params.userId,
        link: params.link,
        metadata: params.metadata,
      },
      params.createdById,
    )

    // Broadcast to user via WebSocket
    this.notificationsGateway.emitToUser(
      params.userId,
      this.toResponseDto(notification),
    )
  }

  async notifyClient(params: NotifyUserParams): Promise<void> {
    // Create notification in database
    const notification = await this.createNotificationUseCase.execute(
      {
        type: params.type,
        title: params.title,
        message: params.message,
        recipientId: params.userId,
        link: params.link,
        metadata: params.metadata,
      },
      params.createdById,
    )

    // Broadcast to client via WebSocket
    this.notificationsGateway.emitToClient(
      params.userId,
      this.toResponseDto(notification),
    )
  }
}
