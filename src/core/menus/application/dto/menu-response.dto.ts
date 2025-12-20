import { ApiProperty } from '@nestjs/swagger'

export class MenuItemDto {
  @ApiProperty({
    description: 'ID único del menú',
    example: '00000000-0000-0000-0000-000000000001',
  })
  id: string

  @ApiProperty({
    description: 'Nombre del menú',
    example: 'Usuarios',
  })
  name: string

  @ApiProperty({
    description: 'Icono del menú (opcional)',
    example: 'UsersIcon',
    nullable: true,
  })
  icon: string | null

  @ApiProperty({
    description: 'Ruta del menú (opcional, null para menús padre)',
    example: '/users',
    nullable: true,
  })
  path: string | null

  @ApiProperty({
    description: 'Orden de aparición del menú',
    example: 1,
  })
  order: number

  @ApiProperty({
    description: 'ID del menú padre (opcional)',
    example: '00000000-0000-0000-0000-000000000002',
    nullable: true,
  })
  parentId: string | null

  @ApiProperty({
    description: 'Submenús hijos',
    type: () => [MenuItemDto],
    isArray: true,
  })
  children: MenuItemDto[]
}

export class MenuResponseDto {
  @ApiProperty({
    description: 'Lista de menús disponibles para el usuario',
    type: [MenuItemDto],
    isArray: true,
  })
  menus: MenuItemDto[]
}
