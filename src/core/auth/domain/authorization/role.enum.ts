/**
 * System Roles
 *
 * These are the 4 fixed roles in the system.
 * No dynamic role creation is allowed.
 *
 * NOTE: Values match the role names stored in the database.
 */
export enum Role {
  ADMINISTRADOR = 'administrador',
  GERENTE = 'gerente',
  AUDITOR = 'auditor',
  CLIENTE = 'cliente',
}
