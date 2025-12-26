import { IsEmail } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario que olvidó su contraseña',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email!: string
}
