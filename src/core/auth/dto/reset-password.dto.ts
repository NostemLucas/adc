import { IsString, MinLength, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Token de recuperación recibido por email',
  })
  @IsString()
  token: string

  @ApiProperty({
    example: 'NewSecurePass123!',
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string
}
