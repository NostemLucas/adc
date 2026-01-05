import { ApiProperty } from '@nestjs/swagger'
import {
  IsText,
  IsEmailAddress,
  IsUsername,
  IsBolivianCI,
  IsNullable,
  IsBolivianPhone,
} from '@shared/validators'
import { IsOptional } from 'class-validator'

export class UpdateInternalUserDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsText('Los nombres')
  names?: string

  @ApiProperty({ example: 'Pérez García', required: false })
  @IsOptional()
  @IsText('Los apellidos')
  lastNames?: string

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  @IsOptional()
  @IsEmailAddress('El email')
  email?: string

  @ApiProperty({ example: 'juanperez', required: false })
  @IsOptional()
  @IsUsername('El nombre de usuario')
  username?: string

  @ApiProperty({ example: '12345678', required: false })
  @IsOptional()
  @IsBolivianCI('La cédula de identidad')
  ci?: string

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
