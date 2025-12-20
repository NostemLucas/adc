/**
 * Permission Domain Entity - Pure domain logic
 */
export class Permission {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromPersistence(data: {
    id: string
    name: string
    resource: string
    action: string
    description: string | null
    createdAt: Date
    updatedAt: Date
  }): Permission {
    return new Permission(
      data.id,
      data.name,
      data.resource,
      data.action,
      data.description,
      data.createdAt,
      data.updatedAt,
    )
  }

  /**
   * Verifica si este permiso permite una acción específica en un recurso
   */
  allows(resource: string, action: string): boolean {
    return this.resource === resource && this.action === action
  }

  /**
   * Verifica si este permiso es de lectura
   */
  get isReadPermission(): boolean {
    return this.action === 'read'
  }

  /**
   * Verifica si este permiso es de escritura (create/update/delete)
   */
  get isWritePermission(): boolean {
    return ['create', 'update', 'delete'].includes(this.action)
  }
}
