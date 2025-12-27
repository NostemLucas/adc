import { DomainException } from './domain.exception'

export class InvalidOrganizationDataException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_ORGANIZATION_DATA')
  }
}

export class EmptyFieldException extends DomainException {
  constructor(fieldName: string) {
    super(`El campo ${fieldName} no puede estar vacío`, 'EMPTY_FIELD')
  }
}

export class OrganizationNotFoundException extends DomainException {
  constructor(organizationId: string) {
    super(
      `No se encontró la organización con ID: ${organizationId}`,
      'ORGANIZATION_NOT_FOUND',
    )
  }
}

export class DuplicateOrganizationException extends DomainException {
  constructor(field: string, value: string) {
    super(
      `Ya existe una organización con ${field}: ${value}`,
      'DUPLICATE_ORGANIZATION',
    )
  }
}
