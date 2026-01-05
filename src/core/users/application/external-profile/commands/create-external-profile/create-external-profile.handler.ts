import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import type {
  IUserRepository,
  IExternalProfileRepository,
} from '../../../../domain'
import {
  USER_REPOSITORY,
  EXTERNAL_PROFILE_REPOSITORY,
} from '../../../../infrastructure/di'
import { User, ExternalProfile } from '../../../../domain'
import { UserUniquenessValidator } from '../../../../domain'
import { CreateExternalProfileCommand } from './create-external-profile.command'
import { TransactionContext } from '@shared/database'
import { Transactional } from '@shared/database/decorators/transactional.decorator'

/**
 * Handler para el comando CreateExternalProfile.
 * Responsable de crear un nuevo perfil externo con su usuario base.
 *
 * ⚠️ IMPORTANTE: Este handler usa transacciones (@Transactional)
 * Si falla la creación del perfil, se revierte la creación del usuario.
 */
@CommandHandler(CreateExternalProfileCommand)
export class CreateExternalProfileHandler implements ICommandHandler<CreateExternalProfileCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EXTERNAL_PROFILE_REPOSITORY)
    private readonly externalProfileRepository: IExternalProfileRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
    private readonly transactionContext: TransactionContext,
  ) {}

  /**
   * Ejecuta el comando dentro de una transacción.
   *
   * Flujo:
   * 1. Validar unicidad (email, username, CI)
   * 2. Validar organizationId
   * 3. [TX START] Crear y guardar usuario
   * 4. [TX] Crear y guardar perfil externo
   * 5. [TX COMMIT] Si todo OK
   * 6. Publicar eventos de dominio
   *
   * @throws {BadRequestException} Si los datos son inválidos
   * @throws {DuplicateEmailException} Si el email ya existe
   * @throws {DuplicateUsernameException} Si el username ya existe
   * @throws {DuplicateCiException} Si el CI ya existe
   */
  @Transactional()
  async execute(command: CreateExternalProfileCommand): Promise<User> {
    const { dto } = command

    // 1. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForCreate(
      dto.email,
      dto.username,
      dto.ci,
    )

    // 2. Validar organizationId
    if (!dto.organizationId) {
      throw new BadRequestException(
        'Los perfiles externos deben tener un organizationId',
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

    // 6. Crear y persistir perfil externo
    const externalProfile = ExternalProfile.create({
      userId: savedUser.id,
      organizationId: dto.organizationId,
      jobTitle: dto.jobTitle || null,
      department: dto.department || null,
      organizationalEmail: dto.organizationalEmail || null,
    })
    await this.externalProfileRepository.save(externalProfile)

    /*     // 7. Marcar como creado (emite evento de dominio)
    savedUser.markAsCreated()

    // 8. Publicar eventos de dominio
    savedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    savedUser.clearDomainEvents() */

    return savedUser
  }
}
