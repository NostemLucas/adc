import { ApiProperty } from '@nestjs/swagger'

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string

  @ApiProperty({ example: 'Juan' })
  names!: string

  @ApiProperty({ example: 'Pérez García' })
  lastNames!: string

  @ApiProperty({ example: 'Juan Pérez García' })
  fullName!: string

  @ApiProperty({ example: 'juan.perez@example.com' })
  email!: string

  @ApiProperty({ example: 'juanperez' })
  username!: string

  @ApiProperty({ example: '12345678' })
  ci!: string

  @ApiProperty({ example: '591-12345678', required: false })
  phone?: string | null

  @ApiProperty({ example: 'Av. Ejemplo #123', required: false })
  address?: string | null

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  image?: string | null

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status!: string

  @ApiProperty({ example: ['ADMINISTRADOR', 'GERENTE'], type: [String] })
  roles!: string[]

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date
}
