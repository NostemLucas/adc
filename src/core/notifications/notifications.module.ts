import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NotificationsController } from './notifications.controller'
import { NotificationsGateway } from './infrastructure/notifications.gateway'
import { NotificationRepository } from './infrastructure/notification.repository'
import { UsersModule } from '../users/users.module'
import {
  CreateNotificationUseCase,
  ListNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllAsReadUseCase,
  GetUnreadCountUseCase,
} from './application/use-cases'
import { NotificationBroadcastService } from './application/services/notification-broadcast.service'

@Module({
  imports: [
    UsersModule, // For UserRepository in gateway and broadcast service
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationRepository,
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    MarkAllAsReadUseCase,
    GetUnreadCountUseCase,
    NotificationBroadcastService,
  ],
  exports: [NotificationBroadcastService, NotificationsGateway],
})
export class NotificationsModule {}
