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
import { CreateExternalProfileDto } from './application/external-profile/commands/create-external-profile/create-external-profile.dto'
import { UpdateExternalProfileDto } from './application/external-profile/commands/update-external-profile/update-external-profile.dto'
import { ExternalProfileResponseDto } from './application/external-profile/queries/get-external-profile/external-profile-response.dto'
import { UploadAvatarResponseDto } from './application/user/commands/upload-avatar/upload-avatar.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '../auth/domain/authorization'
import { UploadAvatar } from '@shared/file-upload'
import { User } from './domain/user'

// Commands
import {
  CreateExternalProfileCommand,
  UpdateExternalProfileCommand,
  DeleteExternalProfileCommand,
} from './application/external-profile'

import { UploadAvatarCommand } from './application/user'

// Queries
import {
  GetExternalProfileQuery,
  ListExternalProfilesQuery,
} from './application/external-profile'

@ApiTags('Perfiles Externos')
@ApiBearerAuth('JWT-auth')
@Controller('external-profiles')
export class ExternalProfilesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @ApiOperation({ summary: 'Crear perfil externo' })
  @ApiResponse({
    status: 201,
    description: 'Perfil externo creado exitosamente',
    type: ExternalProfileResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email o username ya existe' })
  async create(
    @Body() dto: CreateExternalProfileDto,
  ): Promise<ExternalProfileResponseDto> {
    const command = new CreateExternalProfileCommand(dto)
    const user = await this.commandBus.execute<
      CreateExternalProfileCommand,
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
  @ApiOperation({ summary: 'Listar perfiles externos activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfiles externos',
    type: [ExternalProfileResponseDto],
  })
  async list(): Promise<ExternalProfileResponseDto[]> {
    const query = new ListExternalProfilesQuery()
    const users = await this.queryBus.execute<
      ListExternalProfilesQuery,
      User[]
    >(query)

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
  @ApiOperation({ summary: 'Obtener perfil externo por ID' })
  @ApiParam({ name: 'id', description: 'ID del perfil externo' })
  @ApiResponse({
    status: 200,
    description: 'Perfil externo encontrado',
    type: ExternalProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Perfil externo no encontrado' })
  async getById(@Param('id') id: string): Promise<ExternalProfileResponseDto> {
    const query = new GetExternalProfileQuery(id)
    const user = await this.queryBus.execute<GetExternalProfileQuery, User>(
      query,
    )

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
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @ApiOperation({ summary: 'Actualizar perfil externo' })
  @ApiParam({ name: 'id', description: 'ID del perfil externo' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado',
    type: ExternalProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExternalProfileDto,
  ): Promise<ExternalProfileResponseDto> {
    const command = new UpdateExternalProfileCommand(id, dto)
    const user = await this.commandBus.execute<
      UpdateExternalProfileCommand,
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
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UploadAvatar()
  @ApiOperation({
    summary: 'Subir o actualizar avatar de perfil externo',
    description:
      'Permite subir una imagen de avatar para un perfil externo. Si el perfil ya tiene un avatar, este será reemplazado.',
  })
  @ApiParam({ name: 'id', description: 'ID del perfil externo' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
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
  @ApiOperation({ summary: 'Eliminar perfil externo (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del perfil externo' })
  @ApiResponse({ status: 204, description: 'Perfil eliminado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteExternalProfileCommand(id)
    await this.commandBus.execute(command)
  }
}
