/**
 * System Roles (solo para usuarios INTERNAL)
 *
 * Estos roles determinan los permisos dentro del sistema
 * y solo aplican a usuarios de tipo INTERNAL.
 */
export enum SystemRole {
  ADMINISTRADOR = 'administrador',
  GERENTE = 'gerente',
  AUDITOR = 'auditor',
}
