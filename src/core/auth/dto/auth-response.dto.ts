import { ApiProperty } from '@nestjs/swagger'

export class AuthTokensDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string

  @ApiProperty({
    description: 'Token de actualización',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  refreshToken!: string
}

export class LoginResponseDto extends AuthTokensDto {
  @ApiProperty({
    description: 'Datos del usuario autenticado',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
      username: { type: 'string', example: 'johndoe' },
      email: { type: 'string', example: 'john.doe@example.com' },
      fullName: { type: 'string', example: 'John Doe' },
      roles: {
        type: 'array',
        items: { type: 'string' },
        example: ['ADMINISTRADOR', 'GERENTE'],
      },
    },
  })
  user!: {
    id: string
    username: string
    email: string
    fullName: string
    roles: string[]
  }
}

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string

  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'johndoe',
  })
  username!: string

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'john.doe@example.com',
  })
  email!: string

  @ApiProperty({
    description: 'Nombre completo',
    example: 'John Doe',
  })
  fullName!: string

  @ApiProperty({
    description: 'Roles del usuario',
    example: ['ADMINISTRADOR', 'GERENTE'],
    type: [String],
  })
  roles!: string[]
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Sesión cerrada exitosamente',
  })
  message!: string
}
