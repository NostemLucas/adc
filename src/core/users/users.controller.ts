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
  UploadedFile,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateUserDto } from './application/internal-profile/commands/create-internal-user/create-user.dto'
import { UpdateUserDto } from './application/user/commands/update-user/update-user.dto'
import { UserResponseDto } from './application/user/queries/get-user/user-response.dto'
import { UploadAvatarResponseDto } from './application/user/commands/upload-avatar/upload-avatar.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '../auth/domain/authorization'
import { UploadAvatar } from '@shared/file-upload'
import { User } from './domain/user'

// Commands
import {
  UpdateUserCommand,
  DeleteUserCommand,
  UploadAvatarCommand,
} from './application/user'

// Internal Profile Commands
import { CreateUserCommand } from './application/internal-profile'

// Queries
import { GetUserQuery, ListUsersQuery } from './application/user'

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email o username ya existe' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const command = new CreateUserCommand(dto)
    const user = await this.commandBus.execute<CreateUserCommand, User>(command)

    return {
      id: user.id,
      names: user.names.getValue(),
      lastNames: user.lastNames.getValue(),
      fullName: user.fullName,
      email: user.email.getValue(),
      username: user.username.getValue(),
      ci: user.ci.getValue(),
      phone: user.phone?.getValue(),
      address: user.address?.getValue(),
      image: user.image?.getValue(),
      status: user.status,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @ApiOperation({ summary: 'Listar usuarios activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios',
    type: [UserResponseDto],
  })
  async list(): Promise<UserResponseDto[]> {
    const query = new ListUsersQuery()
    const users = await this.queryBus.execute<ListUsersQuery, User[]>(query)

    return users.map((user) => ({
      id: user.id,
      names: user.names.getValue(),
      lastNames: user.lastNames.getValue(),
      fullName: user.fullName,
      email: user.email.getValue(),
      username: user.username.getValue(),
      ci: user.ci.getValue(),
      phone: user.phone?.getValue(),
      address: user.address?.getValue(),
      image: user.image?.getValue(),
      status: user.status,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getById(@Param('id') id: string): Promise<UserResponseDto> {
    const query = new GetUserQuery(id)
    const user = await this.queryBus.execute<GetUserQuery, User>(query)

    return {
      id: user.id,
      names: user.names.getValue(),
      lastNames: user.lastNames.getValue(),
      fullName: user.fullName,
      email: user.email.getValue(),
      username: user.username.getValue(),
      ci: user.ci.getValue(),
      phone: user.phone?.getValue(),
      address: user.address?.getValue(),
      image: user.image?.getValue(),
      status: user.status,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
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
    const command = new UpdateUserCommand(id, dto)
    const user = await this.commandBus.execute<UpdateUserCommand, User>(command)

    return {
      id: user.id,
      names: user.names.getValue(),
      lastNames: user.lastNames.getValue(),
      fullName: user.fullName,
      email: user.email.getValue(),
      username: user.username.getValue(),
      ci: user.ci.getValue(),
      phone: user.phone?.getValue(),
      address: user.address?.getValue(),
      image: user.image?.getValue(),
      status: user.status,
      type: user.type,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Post(':id/avatar')
  @Roles(Role.ADMINISTRADOR)
  @UploadAvatar() // 🔥 Un solo decorador para todo: Multer + Validación + Swagger
  @ApiOperation({
    summary: 'Subir o actualizar avatar de usuario',
    description:
      'Permite subir una imagen de avatar para un usuario. Si el usuario ya tiene un avatar, este será reemplazado.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    const command = new UploadAvatarCommand(id, file)
    const result = await this.commandBus.execute<
      UploadAvatarCommand,
      { avatarUrl: string; avatarPath: string }
    >(command)

    return {
      message: 'Avatar actualizado exitosamente',
      avatarUrl: result.avatarUrl,
      avatarPath: result.avatarPath,
    }
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteUserCommand(id)
    await this.commandBus.execute(command)
  }
}
