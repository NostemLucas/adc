import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, IsArray } from 'class-validator'

export class UpdateUserDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  names?: string

  @ApiProperty({ example: 'Pérez García', required: false })
  @IsOptional()
  @IsString()
  lastNames?: string

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({ example: 'juanperez', required: false })
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({ example: '12345678', required: false })
  @IsOptional()
  @IsString()
  ci?: string

  @ApiProperty({ example: ['role-uuid-1'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[]

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
