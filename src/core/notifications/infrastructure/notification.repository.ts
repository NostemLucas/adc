import { Injectable } from '@nestjs/common'
import { Notification as PrismaNotification, Prisma } from '@prisma/client'
import { PrismaService } from '@shared/database/prisma.service'
import {
  Notification,
  NotificationMetadata,
} from '../domain/notification.entity'
import { NotificationType } from '../domain/notification-type.enum'

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(prismaNotification: PrismaNotification): Notification {
    return Notification.fromPersistence({
      id: prismaNotification.id,
      createdAt: prismaNotification.createdAt,
      updatedAt: prismaNotification.updatedAt,
      deletedAt: prismaNotification.deletedAt,
      type: prismaNotification.type as NotificationType,
      title: prismaNotification.title,
      message: prismaNotification.message,
      link: prismaNotification.link,
      metadata: prismaNotification.metadata as NotificationMetadata | null,
      isRead: prismaNotification.isRead,
      readAt: prismaNotification.readAt,
      recipientId: prismaNotification.recipientId,
      createdById: prismaNotification.createdById,
    })
  }

  async create(notification: Notification): Promise<Notification> {
    const created = await this.prisma.notification.create({
      data: {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || undefined,
        metadata: (notification.metadata as Prisma.InputJsonValue) || undefined,
        isRead: notification.isRead,
        readAt: notification.readAt || undefined,
        recipientId: notification.recipientId,
        createdById: notification.createdById || undefined,
      },
    })
    return this.toDomain(created)
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    })
    return notification ? this.toDomain(notification) : null
  }

  async findByRecipient(
    recipientId: string,
    options: {
      skip?: number
      take?: number
      onlyUnread?: boolean
    } = {},
  ): Promise<{ notifications: Notification[]; total: number }> {
    const where: any = {
      recipientId,
      deletedAt: null,
    }

    if (options.onlyUnread) {
      where.isRead = false
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: options.skip || 0,
        take: options.take || 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ])

    return {
      notifications: notifications.map((n) => this.toDomain(n)),
      total,
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    return this.toDomain(updated)
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    return result.count
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        recipientId,
        isRead: false,
        deletedAt: null,
      },
    })
  }
}
