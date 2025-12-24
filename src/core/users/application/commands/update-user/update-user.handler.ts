import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import type { IUserRepository } from '../../../domain/repositories'
import { USER_REPOSITORY } from '../../../domain/repositories'
import { RoleRepository } from '../../../../roles/infrastructure/role.repository'
import { User } from '../../../domain/user.entity'
import { RoleNotFoundException } from '../../../domain/exceptions'
import { UserUniquenessValidator } from '../../../domain/services'
import { UpdateUserCommand } from './update-user.command'

/**
 * Handler para el comando UpdateUser.
 * Responsable de actualizar un usuario existente.
 */
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly uniquenessValidator: UserUniquenessValidator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { userId, dto } = command

    // 1. Buscar usuario
    const user = await this.userRepository.findByIdOrFail(userId)

    // 2. Validar unicidad usando Domain Service
    await this.uniquenessValidator.validateForUpdate(
      userId,
      dto.email,
      user.email.getValue(),
      dto.username,
      user.username,
      dto.ci,
      user.ci.getValue(),
    )

    // 3. Si hay roleIds, buscar roles
    let roles = user.roles
    if (dto.roleIds) {
      roles = await this.roleRepository.findByIds(dto.roleIds)
      if (roles.length !== dto.roleIds.length) {
        throw new RoleNotFoundException('Algunos roles no existen')
      }
    }

    // 4. Actualizar con método de dominio (validaciones de formato + emite evento)
    user.update({
      names: dto.names,
      lastNames: dto.lastNames,
      email: dto.email,
      username: dto.username,
      ci: dto.ci,
      phone: dto.phone,
      address: dto.address,
      image: dto.image,
      roles: dto.roleIds ? roles : undefined,
    })

    // 5. Persistir
    const updatedUser = await this.userRepository.update(user)

    // 6. Publicar eventos de dominio
    updatedUser.domainEvents.forEach((event) => this.eventBus.publish(event))
    updatedUser.clearDomainEvents()

    return updatedUser
  }
}
