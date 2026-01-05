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

export class CreateExternalProfileDto {
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
    example: 'org-uuid-123',
    description: 'ID de la organización',
  })
  @IsRequired('El ID de organización')
  @IsString({ message: 'El ID de organización debe ser un texto válido' })
  organizationId!: string

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

  @ApiProperty({ example: 'Gerente de Proyecto', required: false })
  @IsOptional()
  @IsText('El título del trabajo')
  jobTitle?: string

  @ApiProperty({ example: 'TI', required: false })
  @IsOptional()
  @IsText('El departamento')
  department?: string

  @ApiProperty({ example: 'juan.perez@organization.com', required: false })
  @IsOptional()
  @IsEmailAddress('El email organizacional')
  organizationalEmail?: string
}
