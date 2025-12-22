/**
 * Custom validation decorators with Spanish error messages
 *
 * These decorators wrap class-validator decorators to provide
 * consistent Spanish error messages across the application.
 *
 * Usage:
 * @IsText('nombres')
 * @MinLength(2, 'nombres')
 * names: string
 */

import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsUUID,
  IsDate,
  IsInt,
  ValidationOptions,
  ValidateNested,
  IsPositive,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'

// ==================== BASIC TYPES ====================

/**
 * Validates that the field is a string
 * @param fieldName Field name in Spanish for error message
 */
export function IsText(fieldName: string, options?: ValidationOptions) {
  return IsString({
    ...options,
    message: `${fieldName} debe ser texto`,
  })
}

/**
 * Validates that the field is a number
 * @param fieldName Field name in Spanish for error message
 */
export function IsNumeric(fieldName: string, options?: ValidationOptions) {
  return IsNumber(
    {},
    {
      ...options,
      message: `${fieldName} debe ser un número`,
    },
  )
}

/**
 * Validates that the field is an integer
 * @param fieldName Field name in Spanish for error message
 */
export function IsInteger(fieldName: string, options?: ValidationOptions) {
  return IsInt({
    ...options,
    message: `${fieldName} debe ser un número entero`,
  })
}

/**
 * Validates that the field is a positive number
 * @param fieldName Field name in Spanish for error message
 */
export function IsPositiveNumber(
  fieldName: string,
  options?: ValidationOptions,
) {
  return IsPositive({
    ...options,
    message: `${fieldName} debe ser un número positivo`,
  })
}

/**
 * Validates that the field is a boolean
 * @param fieldName Field name in Spanish for error message
 */
export function IsBool(fieldName: string, options?: ValidationOptions) {
  return IsBoolean({
    ...options,
    message: `${fieldName} debe ser verdadero o falso`,
  })
}

/**
 * Validates that the field is a valid email
 * @param fieldName Field name in Spanish for error message (default: 'El email')
 */
export function IsEmailAddress(
  fieldName: string = 'El email',
  options?: ValidationOptions,
) {
  return IsEmail(
    {},
    {
      ...options,
      message: `${fieldName} debe ser un correo electrónico válido`,
    },
  )
}

/**
 * Validates that the field is a valid UUID
 * @param fieldName Field name in Spanish for error message
 */
export function IsUniqueId(fieldName: string, options?: ValidationOptions) {
  return IsUUID('4', {
    ...options,
    message: `${fieldName} debe ser un identificador único válido`,
  })
}

/**
 * Validates that the field is a date
 * @param fieldName Field name in Spanish for error message
 */
export function IsDateField(fieldName: string, options?: ValidationOptions) {
  return IsDate({
    ...options,
    message: `${fieldName} debe ser una fecha válida`,
  })
}

// ==================== REQUIRED/OPTIONAL ====================

/**
 * Validates that the field is not empty
 * @param fieldName Field name in Spanish for error message
 */
export function IsRequired(fieldName: string, options?: ValidationOptions) {
  return IsNotEmpty({
    ...options,
    message: `${fieldName} es obligatorio`,
  })
}

/**
 * Marks field as optional (allows null/undefined)
 */
export function IsNullable(options?: ValidationOptions) {
  return IsOptional(options)
}

// ==================== STRING LENGTH ====================

/**
 * Validates minimum string length
 * @param length Minimum length
 * @param fieldName Field name in Spanish for error message
 */
export function MinTextLength(
  length: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return MinLength(length, {
    ...options,
    message: `${fieldName} debe tener al menos ${length} caracteres`,
  })
}

/**
 * Validates maximum string length
 * @param length Maximum length
 * @param fieldName Field name in Spanish for error message
 */
export function MaxTextLength(
  length: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return MaxLength(length, {
    ...options,
    message: `${fieldName} debe tener máximo ${length} caracteres`,
  })
}

/**
 * Validates exact string length
 * @param length Exact length
 * @param fieldName Field name in Spanish for error message
 */
export function ExactTextLength(
  length: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return function (target: any, propertyKey: string) {
    MinLength(length, {
      ...options,
      message: `${fieldName} debe tener exactamente ${length} caracteres`,
    })(target, propertyKey)
    MaxLength(length, {
      ...options,
      message: `${fieldName} debe tener exactamente ${length} caracteres`,
    })(target, propertyKey)
  }
}

// ==================== NUMBER RANGE ====================

/**
 * Validates minimum number value
 * @param value Minimum value
 * @param fieldName Field name in Spanish for error message
 */
export function MinValue(
  value: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return Min(value, {
    ...options,
    message: `${fieldName} debe ser mayor o igual a ${value}`,
  })
}

/**
 * Validates maximum number value
 * @param value Maximum value
 * @param fieldName Field name in Spanish for error message
 */
export function MaxValue(
  value: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return Max(value, {
    ...options,
    message: `${fieldName} debe ser menor o igual a ${value}`,
  })
}

// ==================== PATTERNS ====================

/**
 * Validates against a regex pattern
 * @param pattern Regex pattern
 * @param fieldName Field name in Spanish for error message
 * @param example Optional example of valid format
 */
export function MatchesPattern(
  pattern: RegExp,
  fieldName: string,
  example?: string,
  options?: ValidationOptions,
) {
  const message = example
    ? `${fieldName} tiene un formato inválido. Ejemplo: ${example}`
    : `${fieldName} tiene un formato inválido`

  return Matches(pattern, {
    ...options,
    message,
  })
}

/**
 * Validates Bolivian CI (Cédula de Identidad) format
 * @param fieldName Field name in Spanish for error message (default: 'La cédula')
 */
export function IsBolivianCI(
  fieldName: string = 'La cédula',
  options?: ValidationOptions,
) {
  return Matches(/^\d{7,10}$/, {
    ...options,
    message: `${fieldName} debe tener entre 7 y 10 dígitos`,
  })
}

/**
 * Validates Bolivian phone number format
 * @param fieldName Field name in Spanish for error message (default: 'El teléfono')
 */
export function IsBolivianPhone(
  fieldName: string = 'El teléfono',
  options?: ValidationOptions,
) {
  return Matches(/^[2-7]\d{7}$/, {
    ...options,
    message: `${fieldName} debe ser un número válido de 8 dígitos`,
  })
}

/**
 * Validates strong password (min 8 chars, uppercase, lowercase, number)
 * @param fieldName Field name in Spanish for error message (default: 'La contraseña')
 */
export function IsStrongPassword(
  fieldName: string = 'La contraseña',
  options?: ValidationOptions,
) {
  return Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    ...options,
    message: `${fieldName} debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número`,
  })
}

/**
 * Validates username format (alphanumeric, underscore, hyphen)
 * @param fieldName Field name in Spanish for error message (default: 'El nombre de usuario')
 */
export function IsUsername(
  fieldName: string = 'El nombre de usuario',
  options?: ValidationOptions,
) {
  return Matches(/^[a-zA-Z0-9_-]{3,20}$/, {
    ...options,
    message: `${fieldName} debe tener entre 3 y 20 caracteres (letras, números, guiones y guiones bajos)`,
  })
}

// ==================== ENUMS ====================

/**
 * Validates that value is in enum
 * @param entity Enum object
 * @param fieldName Field name in Spanish for error message
 */
export function IsEnumValue(
  entity: object,
  fieldName: string,
  options?: ValidationOptions,
) {
  const validValues = Object.values(entity).join(', ')
  return IsEnum(entity, {
    ...options,
    message: `${fieldName} debe ser uno de los siguientes valores: ${validValues}`,
  })
}

/**
 * Validates that value is in a list of allowed values
 * @param values Array of allowed values
 * @param fieldName Field name in Spanish for error message
 */
export function IsOneOf(
  values: any[],
  fieldName: string,
  options?: ValidationOptions,
) {
  const validValues = values.join(', ')
  return IsIn(values, {
    ...options,
    message: `${fieldName} debe ser uno de los siguientes valores: ${validValues}`,
  })
}

// ==================== ARRAYS ====================

/**
 * Validates that field is an array
 * @param fieldName Field name in Spanish for error message
 */
export function IsArrayField(fieldName: string, options?: ValidationOptions) {
  return IsArray({
    ...options,
    message: `${fieldName} debe ser un arreglo`,
  })
}

/**
 * Validates minimum array size
 * @param size Minimum size
 * @param fieldName Field name in Spanish for error message
 */
export function MinArraySize(
  size: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return ArrayMinSize(size, {
    ...options,
    message: `${fieldName} debe tener al menos ${size} elementos`,
  })
}

/**
 * Validates maximum array size
 * @param size Maximum size
 * @param fieldName Field name in Spanish for error message
 */
export function MaxArraySize(
  size: number,
  fieldName: string,
  options?: ValidationOptions,
) {
  return ArrayMaxSize(size, {
    ...options,
    message: `${fieldName} debe tener máximo ${size} elementos`,
  })
}

// ==================== NESTED OBJECTS ====================

/**
 * Validates nested object
 * Use with @Type() from class-transformer
 */
export function ValidateNestedObject(options?: ValidationOptions) {
  return ValidateNested(options)
}

/**
 * Transforms to specific type (for nested objects and dates)
 * @param typeFunction Type function (e.g., () => SomeClass)
 */
export function TransformTo(typeFunction: () => any) {
  return Type(typeFunction)
}
