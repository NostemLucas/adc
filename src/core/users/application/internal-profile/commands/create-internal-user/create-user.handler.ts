import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type {
  IUserRepository,
  IInternalProfileRepository,
  IExternalProfileRepository,
} from '../../../../domain'
import {
  USER_REPOSITORY,
  INTERNAL_PROFILE_REPOSITORY,
  EXTERNAL_PROFILE_REPOSITORY,
} from '../../../../infrastructure/di'
import {
  User,
  InternalProfile,
  ExternalProfile,
  UserType,
  SystemRole,
} from '../../../../domain'
import { UserUniquenessValidator } from '../../../../domain'
import { CreateUserCommand } from './create-user.command'

/**
 * Handler para el comando CreateUser.
 * Responsable de crear un nuevo usuario con su perfil correspondiente.
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(INTERNAL_PROFILE_REPOSITORY)
    private readonly internalProfileRepository: IInternalProfileRepository,
    @Inject(EXTERNAL_PROFILE_REPOSITORY)
    private readonly externalProfileRepository: IExternalProfileRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { dto } = command

    // 1. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForCreate(
      dto.email,
      dto.username,
      dto.ci,
    )

    // 2. Validar campos según tipo de usuario
    if (dto.type === UserType.INTERNAL) {
      if (!dto.roles || dto.roles.length === 0) {
        throw new BadRequestException(
          'Los usuarios INTERNAL deben tener al menos un rol',
        )
      }
      // Validar que los roles sean válidos
      const invalidRoles = dto.roles.filter(
        (role) => !Object.values(SystemRole).includes(role as SystemRole),
      )
      if (invalidRoles.length > 0) {
        throw new BadRequestException(
          `Roles inválidos: ${invalidRoles.join(', ')}. Roles válidos: ${Object.values(SystemRole).join(', ')}`,
        )
      }
    } else if (dto.type === UserType.EXTERNAL) {
      if (!dto.organizationId) {
        throw new BadRequestException(
          'Los usuarios EXTERNAL deben tener un organizationId',
        )
      }
    }

    // 3. Hashear contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10)

    // 4. Crear entidad User
    const user = User.create({
      names: dto.names,
      lastNames: dto.lastNames,
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      ci: dto.ci,
      type: dto.type,
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
    })

    // 5. Persistir usuario
    const savedUser = await this.userRepository.save(user)

    // 6. Crear y persistir perfil correspondiente
    if (dto.type === UserType.INTERNAL) {
      const internalProfile = InternalProfile.create({
        userId: savedUser.id,
        roles: dto.roles as SystemRole[],
        department: dto.department || null,
        employeeCode: dto.employeeCode || null,
        hireDate: new Date(),
      })
      await this.internalProfileRepository.save(internalProfile)
    } else {
      const externalProfile = ExternalProfile.create({
        userId: savedUser.id,
        organizationId: dto.organizationId!,
        jobTitle: dto.jobTitle || null,
        department: dto.department || null,
        organizationalEmail: dto.organizationalEmail || null,
      })
      await this.externalProfileRepository.save(externalProfile)
    }

    // 7. Marcar como creado (emite evento de dominio)
    savedUser.markAsCreated()

    // 8. Publicar eventos de dominio
    savedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    savedUser.clearDomainEvents()

    return savedUser
  }
}
