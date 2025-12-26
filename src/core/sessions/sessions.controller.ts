import {
  Controller,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { ListMySessionsUseCase } from './application/use-cases/list-my-sessions.use-case'
import { InvalidateSessionUseCase } from './application/use-cases/invalidate-session.use-case'
import { SessionResponseDto } from './application/dto/session-response.dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../users/domain/user'

@ApiTags('Sesiones')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly listMySessionsUseCase: ListMySessionsUseCase,
    private readonly invalidateSessionUseCase: InvalidateSessionUseCase,
  ) {}

  @Get('my-sessions')
  @ApiOperation({ summary: 'Listar mis sesiones activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sesiones activas del usuario',
    type: [SessionResponseDto],
  })
  async listMySessions(
    @CurrentUser() user: User,
  ): Promise<SessionResponseDto[]> {
    const sessions = await this.listMySessionsUseCase.execute(user.id)

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
    }))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalidar sesión específica' })
  @ApiParam({ name: 'id', description: 'ID de la sesión' })
  @ApiResponse({ status: 204, description: 'Sesión invalidada' })
  async invalidateSession(@Param('id') id: string): Promise<void> {
    await this.invalidateSessionUseCase.execute(id)
  }
}
