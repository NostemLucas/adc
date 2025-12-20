import { Injectable } from '@nestjs/common'
import { MenuRepository } from '../../infrastructure/menu.repository'
import { Menu } from '../../domain/menu.entity'

@Injectable()
export class GetUserMenusUseCase {
  constructor(private readonly menuRepository: MenuRepository) {}

  /**
   * Obtiene los menús filtrados según los permisos del usuario
   * @param userPermissionIds - IDs de los permisos que tiene el usuario
   * @returns Lista de menús accesibles para el usuario
   */
  async execute(userPermissionIds: string[]): Promise<Menu[]> {
    // Obtener todos los menús con su jerarquía
    const allMenus = await this.menuRepository.findAllWithHierarchy()

    // Filtrar menús según permisos del usuario
    const filteredMenus = allMenus
      .map((menu) => menu.filterByPermissions(userPermissionIds))
      .filter((menu): menu is Menu => menu !== null)

    return filteredMenus
  }
}
