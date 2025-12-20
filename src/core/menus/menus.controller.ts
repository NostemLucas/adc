import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { ApiUnauthorizedResponse } from '@shared/swagger'
import { GetUserMenusUseCase } from './application/use-cases/get-user-menus.use-case'
import { MenuResponseDto, MenuItemDto } from './application/dto/menu-response.dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../users/domain/user.entity'

@ApiTags('Menús')
@Controller('menus')
@ApiBearerAuth('JWT-auth')
export class MenusController {
  constructor(private readonly getUserMenusUseCase: GetUserMenusUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener menús del usuario',
    description:
      'Retorna la estructura de menús filtrada según los permisos del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Menús obtenidos exitosamente',
    type: MenuResponseDto,
  })
  @ApiUnauthorizedResponse()
  async getUserMenus(@CurrentUser() user: User): Promise<MenuResponseDto> {
    // Obtener todos los IDs de permisos del usuario a través de sus roles
    const userPermissionIds = user.roles.flatMap((role) =>
      role.permissions.map((permission) => permission.id),
    )

    // Obtener menús filtrados
    const menus = await this.getUserMenusUseCase.execute(userPermissionIds)

    // Mapear a DTOs
    const menuDtos: MenuItemDto[] = menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      icon: menu.icon,
      path: menu.path,
      order: menu.order,
      parentId: menu.parentId,
      children: menu.children.map((child) => ({
        id: child.id,
        name: child.name,
        icon: child.icon,
        path: child.path,
        order: child.order,
        parentId: child.parentId,
        children: [],
      })),
    }))

    return { menus: menuDtos }
  }
}
