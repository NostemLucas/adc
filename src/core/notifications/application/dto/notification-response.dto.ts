import { ApiProperty } from '@nestjs/swagger'
import { NotificationType } from '../../domain/notification-type.enum'

export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ enum: NotificationType, example: NotificationType.INFO })
  type!: NotificationType

  @ApiProperty({ example: 'Nuevo usuario creado' })
  title!: string

  @ApiProperty({ example: 'Se ha creado un nuevo usuario en el sistema' })
  message!: string

  @ApiProperty({ example: '/users/123', required: false })
  link?: string | null

  @ApiProperty({
    example: { userId: '123', action: 'created' },
    required: false,
  })
  metadata?: any

  @ApiProperty({ example: false })
  isRead!: boolean

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  readAt?: Date | null

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date
}
