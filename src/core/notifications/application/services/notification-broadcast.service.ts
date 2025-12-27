import { Injectable, Inject } from '@nestjs/common'
import { NotificationsGateway } from '../../infrastructure/notifications.gateway'
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case'
import { NotificationType } from '../../domain/notification-type.enum'
import { NotificationResponseDto } from '../dto/notification-response.dto'
import {
  Notification,
  NotificationMetadata,
} from '../../domain/notification.entity'
import type {
  IUserRepository,
  IInternalProfileRepository,
} from 'src/core/users/domain'
import {
  USER_REPOSITORY,
  INTERNAL_PROFILE_REPOSITORY,
} from 'src/core/users/infrastructure/di'
import { SystemRole } from 'src/core/users/domain'

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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(INTERNAL_PROFILE_REPOSITORY)
    private readonly internalProfileRepository: IInternalProfileRepository,
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
    // Get all internal profiles with admin role
    const allProfiles = await this.internalProfileRepository.findAll()
    const adminProfiles = allProfiles.filter((p) =>
      p.roles.includes(SystemRole.ADMINISTRADOR),
    )

    // Create and broadcast notifications to each admin
    for (const profile of adminProfiles) {
      const user = await this.userRepository.findByIdOrFail(profile.userId)
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

      // Emit to admin room (all admins)
      this.notificationsGateway.emitToAdmins(this.toResponseDto(notification))
    }
  }

  async notifyManagersAndAuditors(
    params: NotifyManagersAuditorsParams,
  ): Promise<void> {
    // Get all internal profiles with manager or auditor roles
    const allProfiles = await this.internalProfileRepository.findAll()
    const targetProfiles = allProfiles.filter(
      (p) =>
        p.roles.includes(SystemRole.GERENTE) ||
        p.roles.includes(SystemRole.AUDITOR),
    )

    // Create notifications for each user and broadcast
    for (const profile of targetProfiles) {
      const user = await this.userRepository.findByIdOrFail(profile.userId)
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
