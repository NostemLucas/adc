import { ApiProperty } from '@nestjs/swagger'
import {
  IsNullable,
  IsText,
  IsEmailAddress,
  IsUsername,
  IsBolivianCI,
  IsArrayField,
  IsBolivianPhone,
} from '@shared/validators'
import { IsString } from 'class-validator'

export class UpdateUserDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsNullable()
  @IsText('Los nombres')
  names?: string

  @ApiProperty({ example: 'Pérez García', required: false })
  @IsNullable()
  @IsText('Los apellidos')
  lastNames?: string

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  @IsNullable()
  @IsEmailAddress('El email')
  email?: string

  @ApiProperty({ example: 'juanperez', required: false })
  @IsNullable()
  @IsUsername('El nombre de usuario')
  username?: string

  @ApiProperty({ example: '12345678', required: false })
  @IsNullable()
  @IsBolivianCI('La cédula de identidad')
  ci?: string

  @ApiProperty({ example: ['role-uuid-1'], required: false, type: [String] })
  @IsNullable()
  @IsArrayField('Los roles')
  @IsString({ each: true, message: 'Cada rol debe ser un identificador válido' })
  roleIds?: string[]

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
}
