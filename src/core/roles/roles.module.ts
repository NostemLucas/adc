import { Module } from '@nestjs/common'
import { RolesController } from './roles.controller'
import { RoleRepository } from './infrastructure/role.repository'
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case'

@Module({
  controllers: [RolesController],
  providers: [RoleRepository, ListRolesUseCase],
  exports: [RoleRepository],
})
export class RolesModule {}
