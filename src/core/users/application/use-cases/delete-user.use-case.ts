import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../infrastructure/user.repository'

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<void> {
    // Verificar que existe
    await this.userRepository.findByIdOrFail(id)

    // Soft delete
    await this.userRepository.delete(id)
  }
}
