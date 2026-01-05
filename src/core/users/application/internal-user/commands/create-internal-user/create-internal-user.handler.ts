import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type {
  IUserRepository,
  IInternalProfileRepository,
} from '../../../../domain'
import {
  USER_REPOSITORY,
  INTERNAL_PROFILE_REPOSITORY,
} from '../../../../infrastructure/di'
import { User, InternalProfile, SystemRole } from '../../../../domain'
import { UserUniquenessValidator } from '../../../../domain'
import { CreateInternalUserCommand } from './create-internal-user.command'
import { TransactionContext } from '@shared/database'
import { Transactional } from '@shared/database/decorators/transactional.decorator'

/**
 * Handler para el comando CreateInternalUser.
 * Responsable de crear un nuevo usuario interno con su perfil.
 *
 * ⚠️ IMPORTANTE: Este handler usa transacciones (@Transactional)
 * Si falla la creación del perfil, se revierte la creación del usuario.
 */
@CommandHandler(CreateInternalUserCommand)
export class CreateInternalUserHandler
  implements ICommandHandler<CreateInternalUserCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(INTERNAL_PROFILE_REPOSITORY)
    private readonly internalProfileRepository: IInternalProfileRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
    private readonly transactionContext: TransactionContext,
  ) {}

  /**
   * Ejecuta el comando dentro de una transacción.
   *
   * Flujo:
   * 1. Validar unicidad (email, username, CI)
   * 2. Validar roles
   * 3. [TX START] Crear y guardar usuario
   * 4. [TX] Crear y guardar perfil interno
   * 5. [TX COMMIT] Si todo OK
   * 6. Publicar eventos de dominio
   *
   * @throws {BadRequestException} Si los datos son inválidos
   * @throws {DuplicateEmailException} Si el email ya existe
   * @throws {DuplicateUsernameException} Si el username ya existe
   * @throws {DuplicateCiException} Si el CI ya existe
   */
  @Transactional()
  async execute(command: CreateInternalUserCommand): Promise<User> {
    const { dto } = command

    // 1. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForCreate(
      dto.email,
      dto.username,
      dto.ci,
    )

    // 2. Validar roles
    if (!dto.roles || dto.roles.length === 0) {
      throw new BadRequestException(
        'Los usuarios internos deben tener al menos un rol',
      )
    }

    const invalidRoles = dto.roles.filter(
      (role) => !Object.values(SystemRole).includes(role as SystemRole),
    )
    if (invalidRoles.length > 0) {
      throw new BadRequestException(
        `Roles inválidos: ${invalidRoles.join(', ')}. Roles válidos: ${Object.values(SystemRole).join(', ')}`,
      )
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
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
    })

    // 5. Persistir usuario
    const savedUser = await this.userRepository.save(user)

    // 6. Crear y persistir perfil interno
    const internalProfile = InternalProfile.create({
      userId: savedUser.id,
      roles: dto.roles as SystemRole[],
      department: dto.department || null,
      employeeCode: dto.employeeCode || null,
      hireDate: new Date(),
    })
    await this.internalProfileRepository.save(internalProfile)

    // 7. Marcar como creado (emite evento de dominio)
    savedUser.markAsCreated()

    // 8. Publicar eventos de dominio
    savedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    savedUser.clearDomainEvents()

    return savedUser
  }
}
