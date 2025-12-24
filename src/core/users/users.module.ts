import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { UsersController } from './users.controller'
import { UserRepository } from './infrastructure/user.repository'
import { USER_REPOSITORY } from './domain/repositories'
import { RoleRepository } from '../roles/infrastructure/role.repository'
import { UserUniquenessValidator } from './domain/services'

// Commands
import {
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
} from './application/commands'

// Queries
import { GetUserHandler, ListUsersHandler } from './application/queries'

// Event Handlers
import {
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
} from './application/event-handlers'

const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
]

const QueryHandlers = [GetUserHandler, ListUsersHandler]

const EventHandlers = [
  UserCreatedHandler,
  UserUpdatedHandler,
  UserDeletedHandler,
]

@Module({
  imports: [CqrsModule],
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

    // CQRS Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
