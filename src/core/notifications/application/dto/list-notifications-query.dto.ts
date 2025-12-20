import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { NotificationResponseDto } from './notification-response.dto'

export class ListNotificationsQueryDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyUnread?: boolean = false
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data!: NotificationResponseDto[]

  @ApiProperty({ example: 100 })
  total!: number

  @ApiProperty({ example: 1 })
  page!: number

  @ApiProperty({ example: 20 })
  limit!: number

  @ApiProperty({ example: 5 })
  totalPages!: number
}
