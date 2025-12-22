# Custom Validation Decorators

Decoradores personalizados de validación con mensajes de error en español.

## Filosofía

- **Código en inglés**: Los nombres de decoradores, variables y funciones están en inglés para mantener consistencia con el ecosistema de Node.js/NestJS.
- **Mensajes en español**: Los mensajes de error están en español para que el usuario final los entienda fácilmente.

## Instalación

Los decoradores ya están exportados desde `@shared/validators`. Solo importa y usa:

```typescript
import { IsText, IsRequired, MinTextLength } from '@shared/validators'
```

## Uso Básico

### Antes (con class-validator estándar):
```typescript
import { IsString, IsNotEmpty, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsNotEmpty()  // Error: "names should not be empty"
  @IsString()    // Error: "names must be a string"
  @MinLength(2)  // Error: "names must be longer than or equal to 2 characters"
  names: string
}
```

### Después (con decoradores personalizados):
```typescript
import { IsRequired, IsText, MinTextLength } from '@shared/validators'

export class CreateUserDto {
  @IsRequired('Los nombres')      // Error: "Los nombres es obligatorio"
  @IsText('Los nombres')           // Error: "Los nombres debe ser texto"
  @MinTextLength(2, 'Los nombres') // Error: "Los nombres debe tener al menos 2 caracteres"
  names: string
}
```

## Decoradores Disponibles

### Tipos Básicos

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `IsText(fieldName)` | Valida que sea texto | `@IsText('Los nombres')` |
| `IsNumeric(fieldName)` | Valida que sea número | `@IsNumeric('La edad')` |
| `IsInteger(fieldName)` | Valida que sea entero | `@IsInteger('La cantidad')` |
| `IsPositiveNumber(fieldName)` | Valida que sea número positivo | `@IsPositiveNumber('El precio')` |
| `IsBool(fieldName)` | Valida que sea booleano | `@IsBool('El estado activo')` |
| `IsEmailAddress(fieldName?)` | Valida que sea email | `@IsEmailAddress()` |
| `IsUniqueId(fieldName)` | Valida que sea UUID | `@IsUniqueId('El ID')` |
| `IsDateField(fieldName)` | Valida que sea fecha | `@IsDateField('La fecha')` |

### Requerido/Opcional

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `IsRequired(fieldName)` | Campo obligatorio | `@IsRequired('El email')` |
| `IsNullable()` | Campo opcional | `@IsNullable()` |

### Longitud de Texto

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `MinTextLength(length, fieldName)` | Longitud mínima | `@MinTextLength(2, 'Los nombres')` |
| `MaxTextLength(length, fieldName)` | Longitud máxima | `@MaxTextLength(50, 'Los nombres')` |
| `ExactTextLength(length, fieldName)` | Longitud exacta | `@ExactTextLength(8, 'El CI')` |

### Rango de Números

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `MinValue(value, fieldName)` | Valor mínimo | `@MinValue(0, 'El precio')` |
| `MaxValue(value, fieldName)` | Valor máximo | `@MaxValue(100, 'El porcentaje')` |

### Patrones Específicos

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `MatchesPattern(regex, fieldName, example?)` | Patrón personalizado | `@MatchesPattern(/^\d+$/, 'El código', '12345')` |
| `IsBolivianCI(fieldName?)` | CI boliviano (7-10 dígitos) | `@IsBolivianCI('La cédula')` |
| `IsBolivianPhone(fieldName?)` | Teléfono boliviano (8 dígitos) | `@IsBolivianPhone('El teléfono')` |
| `IsStrongPassword(fieldName?)` | Contraseña fuerte | `@IsStrongPassword('La contraseña')` |
| `IsUsername(fieldName?)` | Nombre de usuario | `@IsUsername('El usuario')` |

### Enums y Valores

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `IsEnumValue(enum, fieldName)` | Valor del enum | `@IsEnumValue(UserStatus, 'El estado')` |
| `IsOneOf(values, fieldName)` | Uno de los valores | `@IsOneOf(['admin', 'user'], 'El rol')` |

### Arrays

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `IsArrayField(fieldName)` | Valida que sea array | `@IsArrayField('Los roles')` |
| `MinArraySize(size, fieldName)` | Tamaño mínimo de array | `@MinArraySize(1, 'Los roles')` |
| `MaxArraySize(size, fieldName)` | Tamaño máximo de array | `@MaxArraySize(10, 'Los roles')` |

### Objetos Anidados

| Decorador | Descripción | Ejemplo |
|-----------|-------------|---------|
| `ValidateNestedObject()` | Valida objeto anidado | `@ValidateNestedObject()` |
| `TransformTo(() => Class)` | Transforma a tipo específico | `@TransformTo(() => AddressDto)` |

## Ejemplos Completos

### DTO de Creación de Usuario

```typescript
import { ApiProperty } from '@nestjs/swagger'
import {
  IsRequired,
  IsText,
  IsEmailAddress,
  IsUsername,
  MinTextLength,
  IsBolivianCI,
  IsArrayField,
  IsNullable,
  IsBolivianPhone,
} from '@shared/validators'

export class CreateUserDto {
  @ApiProperty({ example: 'Juan' })
  @IsRequired('Los nombres')
  @IsText('Los nombres')
  @MinTextLength(2, 'Los nombres')
  names: string

  @ApiProperty({ example: 'Pérez' })
  @IsRequired('Los apellidos')
  @IsText('Los apellidos')
  lastNames: string

  @ApiProperty({ example: 'juan@example.com' })
  @IsRequired('El email')
  @IsEmailAddress('El email')
  email: string

  @ApiProperty({ example: 'juanperez' })
  @IsRequired('El nombre de usuario')
  @IsUsername('El nombre de usuario')
  username: string

  @ApiProperty({ example: 'Password123' })
  @IsRequired('La contraseña')
  @IsStrongPassword('La contraseña')
  password: string

  @ApiProperty({ example: '12345678' })
  @IsRequired('La cédula')
  @IsBolivianCI('La cédula')
  ci: string

  @ApiProperty({ example: '70123456', required: false })
  @IsNullable()
  @IsBolivianPhone('El teléfono')
  phone?: string
}
```

### DTO con Validaciones Numéricas

```typescript
export class CreateProductDto {
  @ApiProperty({ example: 'Producto' })
  @IsRequired('El nombre')
  @IsText('El nombre')
  @MinTextLength(3, 'El nombre')
  @MaxTextLength(100, 'El nombre')
  name: string

  @ApiProperty({ example: 99.99 })
  @IsRequired('El precio')
  @IsPositiveNumber('El precio')
  @MinValue(0.01, 'El precio')
  price: number

  @ApiProperty({ example: 10 })
  @IsRequired('La cantidad')
  @IsInteger('La cantidad')
  @MinValue(0, 'La cantidad')
  quantity: number
}
```

### DTO con Enums

```typescript
enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderDto {
  @ApiProperty({ enum: OrderStatus })
  @IsRequired('El estado')
  @IsEnumValue(OrderStatus, 'El estado')
  status: OrderStatus
}
```

### DTO con Arrays

```typescript
export class AssignRolesDto {
  @ApiProperty({ type: [String] })
  @IsRequired('Los roles')
  @IsArrayField('Los roles')
  @MinArraySize(1, 'Los roles')
  @IsString({ each: true, message: 'Cada rol debe ser un texto válido' })
  roleIds: string[]
}
```

## Ventajas

✅ **Consistencia**: Mensajes de error uniformes en toda la aplicación
✅ **Mantenibilidad**: Cambiar un mensaje es tan fácil como modificar un decorador
✅ **Reutilizable**: Úsalos en cualquier DTO
✅ **Type-safe**: Con TypeScript
✅ **Clean Code**: El código se mantiene en inglés
✅ **UX mejorada**: Mensajes claros en español para el usuario final
✅ **Documentado**: JSDoc completo en cada decorador

## Agregar Nuevos Decoradores

Si necesitas un decorador personalizado, agrégalo en `/src/shared/validators/validation.decorators.ts`:

```typescript
/**
 * Validates Bolivian NIT format
 * @param fieldName Field name in Spanish for error message
 */
export function IsBolivianNIT(
  fieldName: string = 'El NIT',
  options?: ValidationOptions,
) {
  return Matches(/^\d{10,12}$/, {
    ...options,
    message: `${fieldName} debe tener entre 10 y 12 dígitos`,
  })
}
```

Luego úsalo en tus DTOs:

```typescript
@IsBolivianNIT('El NIT de la empresa')
nit: string
```

## Notas Importantes

- Los decoradores envuelven `class-validator`, por lo que mantienen toda su funcionalidad
- Puedes combinar decoradores personalizados con los de `class-validator` si es necesario
- El parámetro `fieldName` siempre debe estar en español (es para el mensaje de error)
- Los nombres de decoradores están en inglés para mantener consistencia del código
