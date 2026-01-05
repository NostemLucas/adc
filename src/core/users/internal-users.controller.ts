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
import { CreateInternalUserDto } from './application/internal-user/commands/create-internal-user/create-internal-user.dto'
import { UpdateInternalUserDto } from './application/internal-user/commands/update-internal-user/update-internal-user.dto'
import { InternalUserResponseDto } from './application/internal-user/queries/get-internal-user/internal-user-response.dto'
import { UploadAvatarResponseDto } from './application/user/commands/upload-avatar/upload-avatar.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '../auth/domain/authorization'
import { UploadAvatar } from '@shared/file-upload'
import { User } from './domain/user'

// Commands
import {
  CreateInternalUserCommand,
  UpdateInternalUserCommand,
  DeleteInternalUserCommand,
} from './application/internal-user'

import { UploadAvatarCommand } from './application/user'

// Queries
import {
  GetInternalUserQuery,
  ListInternalUsersQuery,
} from './application/internal-user'

@ApiTags('Usuarios Internos')
@ApiBearerAuth('JWT-auth')
@Controller('internal-users')
export class InternalUsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear usuario interno' })
  @ApiResponse({
    status: 201,
    description: 'Usuario interno creado exitosamente',
    type: InternalUserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email o username ya existe' })
  async create(
    @Body() dto: CreateInternalUserDto,
  ): Promise<InternalUserResponseDto> {
    const command = new CreateInternalUserCommand(dto)
    const user = await this.commandBus.execute<
      CreateInternalUserCommand,
      User
    >(command)

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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @ApiOperation({ summary: 'Listar usuarios internos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios internos',
    type: [InternalUserResponseDto],
  })
  async list(): Promise<InternalUserResponseDto[]> {
    const query = new ListInternalUsersQuery()
    const users = await this.queryBus.execute<ListInternalUsersQuery, User[]>(
      query,
    )

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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @ApiOperation({ summary: 'Obtener usuario interno por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario interno encontrado',
    type: InternalUserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getById(@Param('id') id: string): Promise<InternalUserResponseDto> {
    const query = new GetInternalUserQuery(id)
    const user = await this.queryBus.execute<GetInternalUserQuery, User>(query)

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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar usuario interno' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    type: InternalUserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInternalUserDto,
  ): Promise<InternalUserResponseDto> {
    const command = new UpdateInternalUserCommand(id, dto)
    const user = await this.commandBus.execute<
      UpdateInternalUserCommand,
      User
    >(command)

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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  @Post(':id/avatar')
  @Roles(Role.ADMINISTRADOR)
  @UploadAvatar()
  @ApiOperation({
    summary: 'Subir o actualizar avatar de usuario interno',
    description:
      'Permite subir una imagen de avatar para un usuario interno. Si el usuario ya tiene un avatar, este será reemplazado.',
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
  @ApiOperation({ summary: 'Eliminar usuario interno (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteInternalUserCommand(id)
    await this.commandBus.execute(command)
  }
}
