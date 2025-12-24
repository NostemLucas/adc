/**
 * Query para obtener un usuario por ID.
 * Queries son operaciones de solo lectura.
 */
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}
