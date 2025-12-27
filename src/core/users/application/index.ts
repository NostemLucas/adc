/**
 * Users Application Layer
 *
 * Organizado por Agregados (DDD):
 * - User: Comandos y queries relacionados con el usuario base
 * - InternalProfile: Comandos y queries para usuarios internos
 * - ExternalProfile: Comandos y queries para usuarios externos
 */

// ===== USER AGGREGATE =====
export * from './user'

// ===== INTERNAL PROFILE AGGREGATE =====
export * from './internal-profile'

// ===== EXTERNAL PROFILE AGGREGATE =====
export * from './external-profile'

// ===== SHARED COMPONENTS =====
export * from './shared'
