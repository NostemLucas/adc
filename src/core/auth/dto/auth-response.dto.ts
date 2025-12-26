import { ApiProperty } from '@nestjs/swagger'
import type { MenuItem } from '../domain/authorization'

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

export class LoginResponseDto {
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
      currentRole: { type: 'string', example: 'ADMINISTRADOR' },
    },
  })
  user!: {
    id: string
    username: string
    email: string
    fullName: string
    roles: string[]
    currentRole: string
  }

  @ApiProperty({
    description: 'Tokens de autenticación',
    type: AuthTokensDto,
  })
  tokens!: AuthTokensDto

  @ApiProperty({
    description: 'Menús disponibles para el usuario según sus permisos',
    type: 'array',
    example: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
        order: 1,
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: 'users',
        route: '/users',
        order: 2,
        children: [
          {
            id: 'users-list',
            label: 'Lista de Usuarios',
            route: '/users',
          },
        ],
      },
    ],
  })
  menus!: MenuItem[]

  @ApiProperty({
    description: 'Permisos del usuario',
    type: [String],
    example: ['users:create', 'users:read', 'users:update', 'audits:read'],
  })
  permissions!: string[]
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

  @ApiProperty({
    description: 'Rol activo actual',
    example: 'ADMINISTRADOR',
    type: String,
  })
  currentRole!: string

  @ApiProperty({
    description: 'Menús disponibles para el usuario según sus permisos',
    type: 'array',
  })
  menus!: MenuItem[]

  @ApiProperty({
    description: 'Permisos del usuario',
    type: [String],
    example: ['users:create', 'users:read', 'audits:read'],
  })
  permissions!: string[]
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje de respuesta',
    example: 'Sesión cerrada exitosamente',
  })
  message!: string
}
