import { DomainException } from '@shared/domain'

// ===== EXCEPCIONES DE VALIDACIÓN =====

export class InvalidUserDataException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_USER_DATA')
  }
}

export class InvalidEmailFormatException extends DomainException {
  constructor() {
    super('Formato de email inválido', 'INVALID_EMAIL_FORMAT')
  }
}

export class InvalidCiFormatException extends DomainException {
  constructor() {
    super('Formato de CI inválido', 'INVALID_CI_FORMAT')
  }
}

export class InvalidPhoneFormatException extends DomainException {
  constructor() {
    super('Formato de teléfono inválido', 'INVALID_PHONE_FORMAT')
  }
}

export class InvalidPasswordException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_PASSWORD')
  }
}

export class EmptyFieldException extends DomainException {
  constructor(fieldName: string) {
    super(`El campo ${fieldName} no puede estar vacío`, 'EMPTY_FIELD')
  }
}

// ===== EXCEPCIONES DE ESTADO =====

export class InvalidUserStateException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_USER_STATE')
  }
}

export class UserInactiveException extends DomainException {
  constructor() {
    super('El usuario está inactivo', 'USER_INACTIVE')
  }
}

export class UserLockedException extends DomainException {
  constructor(lockUntil: Date) {
    super(`Usuario bloqueado hasta ${lockUntil.toISOString()}`, 'USER_LOCKED')
  }
}

// ===== EXCEPCIONES DE ROLES =====

export class RoleViolationException extends DomainException {
  constructor(message: string) {
    super(message, 'ROLE_VIOLATION')
  }
}

export class MissingRolesException extends DomainException {
  constructor() {
    super('El usuario debe tener al menos un rol', 'MISSING_ROLES')
  }
}

export class ExclusiveRoleViolationException extends DomainException {
  constructor(roleName: string) {
    super(
      `El rol de ${roleName} es exclusivo y no puede combinarse con otros roles`,
      'EXCLUSIVE_ROLE_VIOLATION',
    )
  }
}

export class RoleNotFoundException extends DomainException {
  constructor(roleIdentifier: string) {
    super(`Rol no encontrado: ${roleIdentifier}`, 'ROLE_NOT_FOUND')
  }
}

// ===== EXCEPCIONES DE UNICIDAD =====

export class DuplicateUserException extends DomainException {
  constructor(field: string, value: string) {
    super(`Ya existe un usuario con ${field}: ${value}`, 'DUPLICATE_USER')
  }
}

export class DuplicateEmailException extends DomainException {
  constructor(email: string) {
    super(`El email ${email} ya está registrado`, 'DUPLICATE_EMAIL')
  }
}

export class DuplicateUsernameException extends DomainException {
  constructor(username: string) {
    super(`El username ${username} ya está registrado`, 'DUPLICATE_USERNAME')
  }
}

export class DuplicateCiException extends DomainException {
  constructor(ci: string) {
    super(`La cédula de identidad ${ci} ya está registrada`, 'DUPLICATE_CI')
  }
}

// ===== EXCEPCIONES DE USER TYPE =====

export class ImmutableUserTypeException extends DomainException {
  constructor() {
    super(
      'El tipo de usuario es inmutable y no puede ser modificado',
      'IMMUTABLE_USER_TYPE',
    )
  }
}

export class InvalidUserTypeException extends DomainException {
  constructor(message: string = 'Tipo de usuario inválido para esta operación') {
    super(message, 'INVALID_USER_TYPE')
  }
}

export class MissingUserProfileException extends DomainException {
  constructor(userType: string) {
    super(
      `El usuario de tipo ${userType} debe tener un perfil correspondiente`,
      'MISSING_USER_PROFILE',
    )
  }
}
