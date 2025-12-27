/**
 * User Types
 *
 * Determina el tipo de usuario y es INMUTABLE después de la creación.
 *
 * - INTERNAL: Personal del sistema (administradores, gerentes, auditores)
 * - EXTERNAL: Usuarios de organizaciones clientes
 */
export enum UserType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}
