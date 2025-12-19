import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  DeleteUserUseCase,
} from './application/use-cases'
import { CreateUserDto } from './application/dto/create-user.dto'
import { UpdateUserDto } from './application/dto/update-user.dto'
import { UserResponseDto } from './application/dto/user-response.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { RoleType } from '../roles/constants'

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Post()
  @Roles(RoleType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email o username ya existe' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute(dto)

    return {
      id: user.id,
      names: user.names,
      lastNames: user.lastNames,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      ci: user.ci,
      phone: user.phone,
      address: user.address,
      image: user.image,
      status: user.status,
      roles: user.roles.map((r) => r.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Get()
  @Roles(RoleType.ADMINISTRADOR, RoleType.GERENTE)
  @ApiOperation({ summary: 'Listar usuarios activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios',
    type: [UserResponseDto],
  })
  async list(): Promise<UserResponseDto[]> {
    const users = await this.listUsersUseCase.execute()

    return users.map((user) => ({
      id: user.id,
      names: user.names,
      lastNames: user.lastNames,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      ci: user.ci,
      phone: user.phone,
      address: user.address,
      image: user.image,
      status: user.status,
      roles: user.roles.map((r) => r.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  }

  @Get(':id')
  @Roles(RoleType.ADMINISTRADOR, RoleType.GERENTE)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.getUserUseCase.execute(id)

    return {
      id: user.id,
      names: user.names,
      lastNames: user.lastNames,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      ci: user.ci,
      phone: user.phone,
      address: user.address,
      image: user.image,
      status: user.status,
      roles: user.roles.map((r) => r.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Put(':id')
  @Roles(RoleType.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserUseCase.execute(id, dto)

    return {
      id: user.id,
      names: user.names,
      lastNames: user.lastNames,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      ci: user.ci,
      phone: user.phone,
      address: user.address,
      image: user.image,
      status: user.status,
      roles: user.roles.map((r) => r.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute(id)
  }
}
