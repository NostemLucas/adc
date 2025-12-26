import { IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '../domain/authorization'

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario o correo electrónico',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'El nombre de usuario o email es requerido' })
  @IsString()
  username!: string

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string

  @ApiPropertyOptional({
    description: 'Rol preferido para iniciar sesión (opcional). Si no se especifica, se usará el primer rol del usuario.',
    enum: ['administrador', 'gerente', 'auditor', 'cliente'],
    example: 'administrador',
  })
  @IsOptional()
  @IsString()
  @IsEnum(Role, { message: 'Rol inválido' })
  preferredRole?: string
}
