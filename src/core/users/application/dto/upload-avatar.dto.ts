import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO para la respuesta de subida de avatar
 */
export class UploadAvatarResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Avatar actualizado exitosamente',
  })
  message: string

  @ApiProperty({
    description: 'URL pública del avatar',
    example: 'http://localhost:3000/uploads/users/avatars/1234567890-abc123.jpg',
  })
  avatarUrl: string

  @ApiProperty({
    description: 'Ruta del archivo en el servidor',
    example: 'users/avatars/1234567890-abc123.jpg',
  })
  avatarPath: string
}
