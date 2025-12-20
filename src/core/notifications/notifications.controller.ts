import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../users/domain/user.entity'
import {
  ListNotificationsUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllAsReadUseCase,
  GetUnreadCountUseCase,
} from './application/use-cases'
import {
  NotificationResponseDto,
  ListNotificationsQueryDto,
  NotificationListResponseDto,
} from './application/dto'

@ApiTags('Notificaciones')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones',
    type: NotificationListResponseDto,
  })
  async list(
    @CurrentUser() user: User,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    const { notifications, total } =
      await this.listNotificationsUseCase.execute(
        user.id,
        query.page,
        query.limit,
        query.onlyUnread,
      )

    const totalPages = Math.ceil(total / query.limit!)

    return {
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        metadata: n.metadata,
        isRead: n.isRead,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      total,
      page: query.page!,
      limit: query.limit!,
      totalPages,
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obtener cantidad de notificaciones no leídas' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad de notificaciones no leídas',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
      },
    },
  })
  async getUnreadCount(@CurrentUser() user: User) {
    return await this.getUnreadCountUseCase.execute(user.id)
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<NotificationResponseDto> {
    const notification = await this.markAsReadUseCase.execute(id, user.id)

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

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones marcadas como leídas',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 10 },
        message: {
          type: 'string',
          example: '10 notificaciones marcadas como leídas',
        },
      },
    },
  })
  async markAllAsRead(@CurrentUser() user: User) {
    const { count } = await this.markAllAsReadUseCase.execute(user.id)
    return {
      count,
      message: `${count} notificaciones marcadas como leídas`,
    }
  }
}
