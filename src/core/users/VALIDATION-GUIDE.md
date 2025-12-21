# Guía de Validaciones - Arquitectura DDD

Esta guía explica **dónde y cómo** implementar cada tipo de validación en una arquitectura DDD/Hexagonal.

## 📋 Tipos de Validaciones

### 1️⃣ Validaciones de Formato/Estructura
**Dónde:** Entidad de Dominio (`user.entity.ts`)
**Cuándo:** Validaciones que NO requieren acceso a la base de datos

✅ **Ejemplos:**
- Email con formato válido
- CI con formato numérico
- Contraseña hasheada correctamente
- Nombres no vacíos
- Al menos un rol asignado

```typescript
// ✅ En user.entity.ts
static create(data) {
  // Validaciones de formato
  if (!User.isValidEmail(data.email)) {
    throw new InvalidEmailFormatException()
  }

  if (!User.isValidCi(data.ci)) {
    throw new InvalidCiFormatException()
  }

  if (data.roles.length === 0) {
    throw new MissingRolesException()
  }

  // ... crear usuario
}
```

### 2️⃣ Validaciones de Unicidad
**Dónde:** Casos de Uso (`create-user.use-case.ts`, `update-user.use-case.ts`)
**Cuándo:** Validaciones que REQUIEREN consultar la base de datos

✅ **Ejemplos:**
- Email único
- Username único
- CI único

```typescript
// ✅ En create-user.use-case.ts
async execute(dto: CreateUserDto) {
  // 1. PRIMERO: Validar unicidad
  await this.validateUniqueness(dto.email, dto.username, dto.ci)

  // 2. DESPUÉS: Crear la entidad
  const user = User.create(dto)

  // 3. Persistir
  return await this.userRepository.create(user)
}

private async validateUniqueness(email, username, ci) {
  const [existingEmail, existingUsername, existingCi] = await Promise.all([
    this.userRepository.findByEmail(email),
    this.userRepository.findByUsername(username),
    this.userRepository.findByCi(ci),
  ])

  if (existingEmail) throw new DuplicateEmailException(email)
  if (existingUsername) throw new DuplicateUsernameException(username)
  if (existingCi) throw new DuplicateCiException(ci)
}
```

### 3️⃣ Validaciones de Reglas de Negocio Complejas
**Dónde:** Domain Services o Use Cases
**Cuándo:** Lógica que involucra múltiples entidades o agregados

✅ **Ejemplos:**
- Un usuario no puede tener rol CLIENTE y ADMINISTRADOR simultáneamente
- Un auditor solo puede auditar empresas de su región
- Un usuario bloqueado no puede hacer login

```typescript
// ✅ En user.entity.ts (regla simple de un solo agregado)
private static validateRoles(roles: Role[]) {
  const hasClientRole = roles.some(r => r.name === EXCLUSIVE_ROLE)

  if (hasClientRole && roles.length > 1) {
    throw new ExclusiveRoleViolationException('CLIENTE')
  }
}

// ✅ En un Domain Service (regla compleja multi-agregado)
@Injectable()
export class UserAssignmentService {
  canAssignAuditorToCompany(auditor: User, company: Company): boolean {
    if (!auditor.isAuditor) return false
    if (auditor.region !== company.region) return false
    return true
  }
}
```

### 4️⃣ Validaciones de DTOs (Entrada HTTP)
**Dónde:** DTOs con class-validator (`create-user.dto.ts`)
**Cuándo:** Validar datos de entrada HTTP

✅ **Ejemplos:**
- Campos requeridos
- Tipos de datos
- Longitud mínima/máxima
- Formato básico (email, URL, etc.)

```typescript
// ✅ En create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  names: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @Matches(/^\d{7,10}$/)
  ci: string
}
```

## 🏗️ Arquitectura de Validaciones

```
┌─────────────────────────────────────────────────────────┐
│ 1. HTTP Request                                         │
│    └─> DTO Validation (class-validator)                │
│        • Tipos, formatos básicos, requeridos            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Use Case (Application Layer)                         │
│    └─> Validaciones de Unicidad                        │
│        • Email único, username único, CI único          │
│    └─> Orquestación de lógica de negocio               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Domain Entity                                        │
│    └─> Validaciones de Formato/Estructura              │
│        • Email válido, CI válido, roles correctos       │
│    └─> Invariantes del dominio                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Repository (Infrastructure)                          │
│    └─> Persistencia                                    │
└─────────────────────────────────────────────────────────┘
```

## ❌ Anti-Patrones (NO hacer)

### ❌ Validar unicidad en la entidad
```typescript
// ❌ MAL - La entidad NO debe conocer el repositorio
class User {
  static async create(data, userRepository) {
    if (await userRepository.findByEmail(data.email)) {
      throw new Error('Email duplicado')
    }
  }
}
```

### ❌ Lógica de negocio en el DTO
```typescript
// ❌ MAL - Los DTOs son solo contratos de entrada
class CreateUserDto {
  @IsEmail()
  email: string

  // ❌ MAL - Lógica de negocio en DTO
  @Validate(EmailMustBeUniqueValidator)
  email: string
}
```

### ❌ Validaciones de formato en el Use Case
```typescript
// ❌ MAL - Las validaciones de formato van en la entidad
async execute(dto) {
  // ❌ MAL - Esto debería estar en User.create()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
    throw new Error('Email inválido')
  }

  const user = User.create(dto) // ← Debería validarse aquí
}
```

## ✅ Resumen de Responsabilidades

| Capa | Responsabilidad | Ejemplos |
|------|----------------|----------|
| **DTO** | Validar entrada HTTP | Tipos, formatos básicos, requeridos |
| **Use Case** | Validar unicidad, orquestación | Email único, username único |
| **Domain Entity** | Validar estructura, invariantes | Email válido, roles correctos |
| **Domain Service** | Reglas de negocio complejas | Asignaciones, permisos complejos |
| **Repository** | Persistencia, consultas | findByEmail, create, update |

## 🎯 Ejemplo Completo: Crear Usuario

```typescript
// 1. DTO - Validación de entrada HTTP
export class CreateUserDto {
  @IsEmail()
  email: string  // ← Valida formato básico

  @IsNotEmpty()
  @MinLength(3)
  username: string

  @Matches(/^\d{7,10}$/)
  ci: string
}

// 2. Use Case - Validación de unicidad
@Injectable()
export class CreateUserUseCase {
  async execute(dto: CreateUserDto) {
    // Validar unicidad ANTES de crear entidad
    await this.validateUniqueness(dto.email, dto.username, dto.ci)

    // Crear entidad (valida formato/estructura)
    const user = User.create(dto)

    // Persistir
    return await this.repository.create(user)
  }

  private async validateUniqueness(email, username, ci) {
    const existing = await this.repository.findByEmail(email)
    if (existing) throw new DuplicateEmailException(email)
    // ... más validaciones
  }
}

// 3. Domain Entity - Validación de formato/estructura
export class User {
  static create(data) {
    // Validar formato de email
    if (!User.isValidEmail(data.email)) {
      throw new InvalidEmailFormatException()
    }

    // Validar reglas de negocio (invariantes)
    User.validateRoles(data.roles)

    // Crear usuario
    const user = new User()
    user.email = data.email
    return user
  }
}
```

## 📚 Recursos

- [DDD Validation](https://enterprisecraftsmanship.com/posts/validation-in-ddd/)
- [Clean Architecture Validation](https://khalilstemmler.com/articles/enterprise-typescript-nodejs/application-layer-use-cases/)
