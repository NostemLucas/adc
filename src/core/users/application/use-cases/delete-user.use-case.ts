import { Injectable, Inject } from '@nestjs/common'
import type { IUserRepository } from '../../domain/repositories'
import { USER_REPOSITORY } from '../../domain/repositories'

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    await this.userRepository.findByIdOrFail(id)

    // Soft delete
    await this.userRepository.delete(id)
  }
}
