import { ApiProperty } from '@nestjs/swagger'

export class RoleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: 'ADMINISTRADOR' })
  name!: string

  @ApiProperty({ example: 'Administrador del sistema', required: false })
  description?: string | null

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date
}
