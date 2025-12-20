export class Menu {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string | null,
    public readonly path: string | null,
    public readonly order: number,
    public readonly isActive: boolean,
    public readonly parentId: string | null,
    public readonly children: Menu[],
    public readonly permissionIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromPersistence(data: {
    id: string
    name: string
    icon: string | null
    path: string | null
    order: number
    isActive: boolean
    parentId: string | null
    children?: Menu[]
    permissions?: Array<{ id: string }>
    createdAt: Date
    updatedAt: Date
  }): Menu {
    return new Menu(
      data.id,
      data.name,
      data.icon,
      data.path,
      data.order,
      data.isActive,
      data.parentId,
      data.children || [],
      data.permissions?.map((p) => p.id) || [],
      data.createdAt,
      data.updatedAt,
    )
  }

  get hasChildren(): boolean {
    return this.children.length > 0
  }

  get isParent(): boolean {
    return this.parentId === null
  }

  get isChild(): boolean {
    return this.parentId !== null
  }

  hasPermission(userPermissionIds: string[]): boolean {
    // Si el menú no tiene permisos asociados, es accesible para todos
    if (this.permissionIds.length === 0) {
      return true
    }

    // El usuario debe tener al menos uno de los permisos requeridos
    return this.permissionIds.some((permId) =>
      userPermissionIds.includes(permId),
    )
  }

  filterByPermissions(userPermissionIds: string[]): Menu | null {
    // Filtrar hijos recursivamente primero
    const filteredChildren = this.children
      .map((child) => child.filterByPermissions(userPermissionIds))
      .filter((child): child is Menu => child !== null)

    // Si el menú es padre y no tiene permisos propios, solo mostrarlo si tiene hijos accesibles
    if (this.permissionIds.length === 0 && this.hasChildren) {
      // Si es un menú padre sin permisos y no tiene hijos accesibles, no mostrarlo
      if (filteredChildren.length === 0) {
        return null
      }
      // Si tiene hijos accesibles, mostrarlo
      return new Menu(
        this.id,
        this.name,
        this.icon,
        this.path,
        this.order,
        this.isActive,
        this.parentId,
        filteredChildren,
        this.permissionIds,
        this.createdAt,
        this.updatedAt,
      )
    }

    // Si el menú tiene permisos, verificar que el usuario tenga acceso
    if (!this.hasPermission(userPermissionIds)) {
      return null
    }

    // Retornar el menú con los hijos filtrados
    return new Menu(
      this.id,
      this.name,
      this.icon,
      this.path,
      this.order,
      this.isActive,
      this.parentId,
      filteredChildren,
      this.permissionIds,
      this.createdAt,
      this.updatedAt,
    )
  }
}
