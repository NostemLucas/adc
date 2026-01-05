import { ApiProperty } from '@nestjs/swagger'
import {
  IsRequired,
  IsText,
  IsEmailAddress,
  IsUsername,
  MinTextLength,
  IsBolivianCI,
  IsNullable,
  IsBolivianPhone,
} from '@shared/validators'
import { IsString, IsOptional } from 'class-validator'

export class CreateInternalUserDto {
  @ApiProperty({ example: 'Juan', description: 'Nombres del usuario' })
  @IsRequired('Los nombres')
  @IsText('Los nombres')
  names!: string

  @ApiProperty({
    example: 'Pérez García',
    description: 'Apellidos del usuario',
  })
  @IsRequired('Los apellidos')
  @IsText('Los apellidos')
  lastNames!: string

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Email del usuario',
  })
  @IsRequired('El email')
  @IsEmailAddress('El email')
  email!: string

  @ApiProperty({ example: 'juanperez', description: 'Nombre de usuario' })
  @IsRequired('El nombre de usuario')
  @IsUsername('El nombre de usuario')
  username!: string

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña',
    minLength: 6,
  })
  @IsRequired('La contraseña')
  @MinTextLength(6, 'La contraseña')
  password!: string

  @ApiProperty({ example: '12345678', description: 'Cédula de identidad' })
  @IsRequired('La cédula de identidad')
  @IsBolivianCI('La cédula de identidad')
  ci!: string

  @ApiProperty({
    example: ['administrador', 'gerente'],
    description:
      'Roles del sistema. Valores: administrador, gerente, auditor',
    type: [String],
    enum: ['administrador', 'gerente', 'auditor'],
  })
  @IsRequired('Los roles')
  @IsString({ each: true, message: 'Cada rol debe ser un texto válido' })
  roles!: string[]

  @ApiProperty({ example: '70123456', required: false })
  @IsNullable()
  @IsBolivianPhone('El teléfono')
  phone?: string

  @ApiProperty({ example: 'Av. Ejemplo #123', required: false })
  @IsNullable()
  @IsText('La dirección')
  address?: string

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsNullable()
  @IsText('La imagen')
  image?: string

  @ApiProperty({ example: 'TI', required: false })
  @IsOptional()
  @IsText('El departamento')
  department?: string

  @ApiProperty({ example: 'EMP-001', required: false })
  @IsOptional()
  @IsText('El código de empleado')
  employeeCode?: string
}
