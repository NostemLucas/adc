import { Module } from '@nestjs/common'
import { MenusController } from './menus.controller'
import { MenuRepository } from './infrastructure/menu.repository'
import { GetUserMenusUseCase } from './application/use-cases/get-user-menus.use-case'

@Module({
  controllers: [MenusController],
  providers: [MenuRepository, GetUserMenusUseCase],
  exports: [MenuRepository],
})
export class MenusModule {}
