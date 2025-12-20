import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'
import { ApiUnauthorizedResponse, ApiForbiddenResponse } from '@shared/swagger'
import { AuthService } from './services/auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import {
  LoginResponseDto,
  AuthTokensDto,
  UserProfileResponseDto,
  MessageResponseDto,
} from './dto/auth-response.dto'
import { Public } from './decorators/public.decorator'
import { CurrentUser } from './decorators/current-user.decorator'
import { User } from '../users/domain/user.entity'
import type { Request } from 'express'

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario con sus credenciales y retorna tokens de acceso y actualización',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse('Credenciales inválidas', 'Credenciales inválidas')
  @ApiForbiddenResponse(
    'Usuario bloqueado o inactivo',
    'Usuario bloqueado. Intente nuevamente en 30 minutos',
  )
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const userAgent = req.headers['user-agent']
    return this.authService.login(
      loginDto.username,
      loginDto.password,
      ip,
      userAgent,
    )
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar tokens',
    description:
      'Genera nuevos tokens de acceso y actualización usando un refresh token válido',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens actualizados exitosamente',
    type: AuthTokensDto,
  })
  @ApiUnauthorizedResponse(
    'Token de actualización inválido o expirado',
    'Token inválido o expirado',
  )
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Invalida el refresh token actual y cierra la sesión del usuario',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse()
  async logout(
    @CurrentUser() user: User,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    await this.authService.logout(user.id, refreshTokenDto.refreshToken)
    return { message: 'Sesión cerrada exitosamente' }
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cerrar todas las sesiones',
    description:
      'Invalida todos los refresh tokens del usuario y cierra todas sus sesiones activas',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las sesiones cerradas exitosamente',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse()
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAll(user.id)
    return { message: 'Todas las sesiones han sido cerradas' }
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Retorna la información del usuario autenticado actualmente',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse()
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map((role) => role.name),
    }
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description:
      'Envía un email con un link para restablecer la contraseña. Por seguridad, siempre retorna éxito aunque el email no exista.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperación enviado (si el email existe)',
    type: MessageResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email)
    return {
      message:
        'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña',
    }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Restablece la contraseña usando el token recibido por email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    type: MessageResponseDto,
  })
  @ApiUnauthorizedResponse(
    'Token inválido o expirado',
    'El token de recuperación es inválido o ha expirado',
  )
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword)
    return {
      message:
        'Contraseña restablecida exitosamente. Puedes iniciar sesión con tu nueva contraseña',
    }
  }
}
