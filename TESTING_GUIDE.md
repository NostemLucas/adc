# Guía de Testing - Sistema de Auditorías

## 📋 Resumen

Este proyecto implementa tests unitarios y de integración para garantizar la calidad del código.

### Cobertura Actual de Tests

✅ **CreateUserUseCase** - 5 tests
✅ **UpdateUserUseCase** - 4 tests
✅ **AuthService** - 12 tests

**Total: 21 tests pasando**

## 🚀 Ejecutar Tests

### Todos los tests

```bash
npm test
```

### Tests específicos

```bash
# Un archivo específico
npm test -- create-user.use-case.spec.ts

# Por patrón
npm test -- auth

# Con cobertura
npm test -- --coverage

# En modo watch
npm test -- --watch
```

### Ver cobertura

```bash
npm test -- --coverage
```

Abre `coverage/lcov-report/index.html` en tu navegador para ver el reporte detallado.

## 📁 Estructura de Tests

```
src/
├── core/
│   ├── users/
│   │   └── application/
│   │       └── use-cases/
│   │           ├── create-user.use-case.ts
│   │           └── create-user.use-case.spec.ts  ✅
│   │
│   └── auth/
│       └── services/
│           ├── auth.service.ts
│           └── auth.service.spec.ts  ✅
│
└── test/
    └── e2e/
        └── auth.e2e-spec.ts  (pendiente)
```

## ✍️ Escribir Tests

### Ejemplo: Test de Use Case

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { CreateUserUseCase } from './create-user.use-case'
import { UserRepository } from '../../infrastructure/user.repository'

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let userRepository: jest.Mocked<UserRepository>

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile()

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase)
    userRepository = module.get(UserRepository)
  })

  it('debe crear un usuario exitosamente', async () => {
    // Arrange
    const dto = { names: 'Juan', email: 'juan@example.com', ... }
    const mockUser = { id: '1', ...dto }
    userRepository.create.mockResolvedValue(mockUser)

    // Act
    const result = await useCase.execute(dto)

    // Assert
    expect(userRepository.create).toHaveBeenCalled()
    expect(result).toEqual(mockUser)
  })
})
```

### Patrón AAA (Arrange-Act-Assert)

Todos los tests siguen el patrón AAA:

```typescript
it('debe hacer X cuando Y', async () => {
  // Arrange: Preparar datos y mocks
  const input = { ... }
  repository.method.mockResolvedValue(expectedOutput)

  // Act: Ejecutar la función bajo test
  const result = await service.method(input)

  // Assert: Verificar el resultado
  expect(repository.method).toHaveBeenCalledWith(input)
  expect(result).toEqual(expectedOutput)
})
```

## 🔧 Mocking

### Mocking de Repositorios

```typescript
const mockUserRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

// En el test
userRepository.findById.mockResolvedValue(mockUser)
```

### Mocking de bcrypt

```typescript
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt')

// En el test
const VALID_BCRYPT_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
;(bcrypt.hash as jest.Mock).mockResolvedValue(VALID_BCRYPT_HASH)
;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
```

### Mocking de JwtService

```typescript
const mockJwtService = {
  signAsync: jest.fn(),
  verify: jest.fn(),
}

jwtService.signAsync.mockResolvedValue('token-jwt')
jwtService.verify.mockReturnValue({ sub: 'user-1' })
```

## 📊 Tests Implementados

### CreateUserUseCase

**Archivo:** `src/core/users/application/use-cases/create-user.use-case.spec.ts`

**Casos de prueba:**
- ✅ Debe crear un usuario exitosamente
- ✅ Debe hashear la contraseña antes de crear el usuario
- ✅ Debe asignar los roles encontrados al usuario
- ✅ Debe fallar si no encuentra roles
- ✅ Debe propagar errores del repositorio

**Ejecutar:**
```bash
npm test -- create-user.use-case.spec.ts
```

### UpdateUserUseCase

**Archivo:** `src/core/users/application/use-cases/update-user.use-case.spec.ts`

**Casos de prueba:**
- ✅ Debe actualizar un usuario exitosamente
- ✅ Debe lanzar NotFoundException si el usuario no existe
- ✅ Debe actualizar roles si se proporcionan roleIds
- ✅ No debe llamar roleRepository si no se proporcionan roleIds

**Ejecutar:**
```bash
npm test -- update-user.use-case.spec.ts
```

### AuthService

**Archivo:** `src/core/auth/services/auth.service.spec.ts`

**Casos de prueba - Login:**
- ✅ Debe hacer login exitosamente con credenciales válidas
- ✅ Debe lanzar UnauthorizedException si el usuario no existe
- ✅ Debe incrementar intentos fallidos con contraseña incorrecta
- ✅ Debe lanzar UnauthorizedException si el usuario está bloqueado
- ✅ Debe crear una sesión después de login exitoso

**Casos de prueba - RefreshTokens:**
- ✅ Debe generar nuevos tokens con refresh token válido
- ✅ Debe lanzar UnauthorizedException si el refresh token es inválido
- ✅ Debe lanzar UnauthorizedException si la sesión no existe
- ✅ Debe invalidar sesión si el usuario está inactivo

**Casos de prueba - Logout:**
- ✅ Debe invalidar la sesión actual
- ✅ No debe fallar si la sesión no existe

**Casos de prueba - LogoutAll:**
- ✅ Debe invalidar todas las sesiones del usuario

**Ejecutar:**
```bash
npm test -- auth.service.spec.ts
```

## 🎯 Buenas Prácticas

### 1. Nombres Descriptivos

❌ **Mal:**
```typescript
it('test 1', () => {})
it('works', () => {})
```

✅ **Bien:**
```typescript
it('debe crear un usuario cuando se proporcionan datos válidos', () => {})
it('debe lanzar error cuando el email ya existe', () => {})
```

### 2. Tests Independientes

Cada test debe poder ejecutarse de forma aislada:

```typescript
beforeEach(() => {
  // Resetear mocks
  jest.clearAllMocks()
})
```

### 3. Evitar Lógica en Tests

❌ **Mal:**
```typescript
it('test', () => {
  const users = getUsers()
  if (users.length > 0) {
    expect(users[0].name).toBe('Juan')
  }
})
```

✅ **Bien:**
```typescript
it('debe retornar el primer usuario con nombre Juan', () => {
  const users = getUsers()
  expect(users).toHaveLength(1)
  expect(users[0].name).toBe('Juan')
})
```

### 4. Un Assert por Concepto

Cada test debe verificar **un** comportamiento específico:

```typescript
// Si necesitas verificar múltiples cosas relacionadas, está bien
it('debe crear usuario con datos completos', () => {
  expect(user.name).toBe('Juan')
  expect(user.email).toBe('juan@example.com')
  expect(user.roles).toHaveLength(1)
})
```

## 🐛 Debugging Tests

### Ver output detallado

```bash
npm test -- --verbose
```

### Ejecutar solo un test

```typescript
// Agregar .only
it.only('debe hacer X', () => {})

// O en el describe
describe.only('MiServicio', () => {})
```

### Saltar tests temporalmente

```typescript
it.skip('test que falla', () => {})
```

### Logs en tests

```typescript
it('test con logs', () => {
  console.log('Valor:', someValue)
  expect(someValue).toBe(expected)
})
```

## 📈 Cobertura de Tests

### Objetivo de Cobertura

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

### Ver reporte de cobertura

```bash
npm test -- --coverage
```

### Excluir archivos de cobertura

Ya configurado en `package.json`:
- `**/*.spec.ts` - Tests
- `**/*.module.ts` - Módulos
- `**/main.ts` - Bootstrap

## 🔄 Configuración de Jest

**Archivo:** `package.json`

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@shared/(.*)$": "<rootDir>/shared/$1",
      "^@shared$": "<rootDir>/shared",
      "^src/core/(.*)$": "<rootDir>/core/$1",
      "^src/shared/(.*)$": "<rootDir>/shared/$1",
      "^src/(.*)$": "<rootDir>/$1"
    }
  }
}
```

## 📝 Tareas Pendientes

### Tests por Implementar

- [ ] GetUserUseCase tests
- [ ] ListUsersUseCase tests
- [ ] DeleteUserUseCase tests
- [ ] ListRolesUseCase tests
- [ ] SessionsUseCase tests
- [ ] E2E tests para auth endpoints
- [ ] E2E tests para users endpoints
- [ ] Integration tests con base de datos real

## 🎨 Scripts Útiles

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Última actualización:** ${new Date().toISOString().split('T')[0]}

**Tests totales:** 21 ✅
