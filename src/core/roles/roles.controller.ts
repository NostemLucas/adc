import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case'
import { RoleResponseDto } from './application/dto/role-response.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleType } from './constants'

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly listRolesUseCase: ListRolesUseCase) {}

  @Get()
  @Roles(RoleType.ADMINISTRADOR, RoleType.GERENTE)
  @ApiOperation({ summary: 'Listar todos los roles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles',
    type: [RoleResponseDto],
  })
  async list(): Promise<RoleResponseDto[]> {
    const roles = await this.listRolesUseCase.execute()

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }))
  }
}
