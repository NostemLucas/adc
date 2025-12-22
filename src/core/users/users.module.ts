import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UserRepository } from './infrastructure/user.repository'
import { USER_REPOSITORY } from './domain/repositories'
import { RoleRepository } from '../roles/infrastructure/role.repository'
import {
  CreateUserUseCase,
  UpdateUserUseCase,
  GetUserUseCase,
  ListUsersUseCase,
  DeleteUserUseCase,
} from './application/use-cases'
import { UploadAvatarUseCase } from './application/use-cases/upload-avatar.use-case'
import { UserUniquenessValidator } from './domain/services'

@Module({
  controllers: [UsersController],
  providers: [
    // Infrastructure - Repository with DI token
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    RoleRepository,

    // Domain Services
    UserUniquenessValidator,

    // Use Cases
    CreateUserUseCase,
    UpdateUserUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    DeleteUserUseCase,
    UploadAvatarUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
