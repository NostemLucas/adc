import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator'
import { NotificationType } from '../../domain/notification-type.enum'

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, example: NotificationType.INFO })
  @IsEnum(NotificationType)
  type!: NotificationType

  @ApiProperty({ example: 'Nuevo usuario creado' })
  @IsString()
  @IsNotEmpty()
  title!: string

  @ApiProperty({ example: 'Se ha creado un nuevo usuario en el sistema' })
  @IsString()
  @IsNotEmpty()
  message!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  recipientId!: string

  @ApiProperty({ example: '/users/123', required: false })
  @IsString()
  @IsOptional()
  link?: string

  @ApiProperty({
    example: { userId: '123', action: 'created' },
    required: false,
  })
  @IsOptional()
  metadata?: any
}
