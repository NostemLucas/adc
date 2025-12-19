export enum RoleType {
  ADMINISTRADOR = 'administrador',
  GERENTE = 'gerente',
  AUDITOR = 'auditor',
  CLIENTE = 'cliente',
}

export const ROLE_IDS = {
  [RoleType.ADMINISTRADOR]: '1',
  [RoleType.GERENTE]: '2',
  [RoleType.AUDITOR]: '3',
  [RoleType.CLIENTE]: '4',
} as const

// Roles que pueden combinarse
export const COMBINABLE_ROLES = [
  RoleType.ADMINISTRADOR,
  RoleType.GERENTE,
  RoleType.AUDITOR,
]

// Rol exclusivo que no puede combinarse con otros
export const EXCLUSIVE_ROLE = RoleType.CLIENTE
