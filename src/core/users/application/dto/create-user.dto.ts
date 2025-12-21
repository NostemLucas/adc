import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
} from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario' })
  @IsNotEmpty()
  @IsString()
  names!: string

  @ApiProperty({
    example: 'Pérez García',
    description: 'Apellidos del usuario',
  })
  @IsNotEmpty()
  @IsString()
  lastNames!: string

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Email del usuario',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'juanperez', description: 'Nombre de usuario' })
  @IsNotEmpty()
  @IsString()
  username!: string

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string

  @ApiProperty({ example: '12345678', description: 'Cédula de identidad' })
  @IsNotEmpty()
  @IsString()
  ci!: string

  @ApiProperty({
    example: ['role-uuid-1', 'role-uuid-2'],
    description: 'IDs de los roles del usuario',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  roleIds!: string[]

  @ApiProperty({ example: '591-12345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ example: 'Av. Ejemplo #123', required: false })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string
}
