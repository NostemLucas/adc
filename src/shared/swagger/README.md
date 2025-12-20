# Decoradores de Swagger

Sistema de decoradores reutilizables para respuestas de error en Swagger, eliminando código repetitivo en los controllers.

## ✨ Ventajas

- **DRY (Don't Repeat Yourself)**: No más schemas inline repetitivos
- **Type-safe**: DTOs tipados para todas las respuestas de error
- **Limpio**: Controllers mucho más legibles
- **Mantenible**: Cambios en un solo lugar
- **Personalizable**: Acepta descripciones y ejemplos custom

## 📦 Decoradores Disponibles

### Errores HTTP Comunes

```typescript
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@shared/swagger'
```

### Decoradores Compuestos

```typescript
import { ApiAuthResponses, ApiCrudResponses } from '@shared/swagger'
```

## 🔧 Uso Básico

### Antes (❌ Repetitivo y verboso)

```typescript
@ApiResponse({
  status: 401,
  description: 'No autorizado',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'No autorizado' },
      error: { type: 'string', example: 'Unauthorized' },
    },
  },
})
```

### Después (✅ Limpio y simple)

```typescript
@ApiUnauthorizedResponse()
```

## 📚 Ejemplos de Uso

### 1. Respuesta Simple (usar defaults)

```typescript
@Post('login')
@ApiResponse({ status: 200, type: LoginResponseDto })
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto)
}
```

### 2. Respuesta Personalizada

```typescript
@Post('create-user')
@ApiResponse({ status: 201, type: UserDto })
@ApiBadRequestResponse(
  'Datos de usuario inválidos',
  'El email ya está registrado'
)
@ApiConflictResponse(
  'Usuario ya existe',
  'El nombre de usuario ya está en uso'
)
async createUser(@Body() dto: CreateUserDto) {
  return this.userService.create(dto)
}
```

### 3. Múltiples Errores

```typescript
@Get(':id')
@ApiResponse({ status: 200, type: UserDto })
@ApiUnauthorizedResponse()
@ApiForbiddenResponse('No tienes permisos para ver este usuario')
@ApiNotFoundResponse('Usuario no encontrado', 'El usuario con ID ${id} no existe')
async getUser(@Param('id') id: string) {
  return this.userService.findById(id)
}
```

### 4. Usar Decoradores Compuestos

```typescript
// Para endpoints que requieren auth
@Get('me')
@ApiResponse({ status: 200, type: ProfileDto })
@ApiAuthResponses() // Aplica 401 Unauthorized automáticamente
async getProfile(@CurrentUser() user: User) {
  return user
}

// Para endpoints CRUD estándar
@Put(':id')
@ApiResponse({ status: 200, type: UserDto })
@ApiCrudResponses() // Aplica 400, 401, 404, 500 automáticamente
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.userService.update(id, dto)
}
```

## 🎯 Referencia Completa

### ApiBadRequestResponse

```typescript
ApiBadRequestResponse(description?: string, example?: string)
```

- **Status**: 400
- **Default Description**: "Datos de entrada inválidos"
- **Default Example**: "Datos de entrada inválidos"
- **Uso**: Errores de validación

### ApiUnauthorizedResponse

```typescript
ApiUnauthorizedResponse(description?: string, example?: string)
```

- **Status**: 401
- **Default Description**: "No autorizado"
- **Default Example**: "No autorizado"
- **Uso**: Usuario no autenticado o token inválido

### ApiForbiddenResponse

```typescript
ApiForbiddenResponse(description?: string, example?: string)
```

- **Status**: 403
- **Default Description**: "Acceso denegado"
- **Default Example**: "Acceso denegado"
- **Uso**: Usuario autenticado pero sin permisos

### ApiNotFoundResponse

```typescript
ApiNotFoundResponse(description?: string, example?: string)
```

- **Status**: 404
- **Default Description**: "Recurso no encontrado"
- **Default Example**: "Recurso no encontrado"
- **Uso**: Recurso solicitado no existe

### ApiConflictResponse

```typescript
ApiConflictResponse(description?: string, example?: string)
```

- **Status**: 409
- **Default Description**: "Conflicto con el estado actual del recurso"
- **Default Example**: "El recurso ya existe"
- **Uso**: Duplicados, conflictos de estado

### ApiInternalServerErrorResponse

```typescript
ApiInternalServerErrorResponse(description?: string, example?: string)
```

- **Status**: 500
- **Default Description**: "Error interno del servidor"
- **Default Example**: "Error interno del servidor"
- **Uso**: Errores inesperados del servidor

### ApiAuthResponses (Compuesto)

```typescript
ApiAuthResponses()
```

- Aplica: `@ApiUnauthorizedResponse()`
- **Uso**: Endpoints que requieren autenticación

### ApiCrudResponses (Compuesto)

```typescript
ApiCrudResponses()
```

- Aplica:
  - `@ApiBadRequestResponse()`
  - `@ApiUnauthorizedResponse()`
  - `@ApiNotFoundResponse()`
  - `@ApiInternalServerErrorResponse()`
- **Uso**: Endpoints CRUD estándar

## 🌟 Ejemplo Completo: Controller Refactorizado

**Antes:**

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'No autorizado' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id)
  }
}
```

**Después:**

```typescript
import { ApiUnauthorizedResponse, ApiNotFoundResponse } from '@shared/swagger'

@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiResponse({ status: 200, type: UserDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse()
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id)
  }
}
```

## 📝 Notas

- Los decoradores son **opcionales** - si no necesitas personalizar, usa los defaults
- Si necesitas un mensaje custom, pasa el `example` parameter
- Los DTOs están disponibles en `@shared/swagger/dto/error-response.dto`
- Para crear nuevos decoradores, edita `src/shared/swagger/decorators/api-error-responses.decorator.ts`

## 🔨 Extender

Para agregar nuevos decoradores personalizados:

```typescript
// src/shared/swagger/decorators/api-error-responses.decorator.ts

export const ApiCustomErrorResponse = (description?: string, example?: string) => {
  return applyDecorators(
    ApiResponse({
      status: 418, // I'm a teapot 🫖
      description: description || 'Custom error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 418 },
          message: { type: 'string', example: example || 'Custom error message' },
          error: { type: 'string', example: 'Custom Error' },
        },
      },
    }),
  )
}
```
