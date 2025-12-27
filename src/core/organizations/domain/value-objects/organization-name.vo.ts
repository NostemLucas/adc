import { InvalidOrganizationDataException } from '../exceptions'

export class OrganizationName {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string | null | undefined): OrganizationName {
    if (!value || !value.trim()) {
      throw new InvalidOrganizationDataException(
        'El nombre de la organización no puede estar vacío',
      )
    }

    const trimmed = value.trim()

    if (trimmed.length < 3) {
      throw new InvalidOrganizationDataException(
        'El nombre de la organización debe tener al menos 3 caracteres',
      )
    }

    if (trimmed.length > 200) {
      throw new InvalidOrganizationDataException(
        'El nombre de la organización no puede exceder 200 caracteres',
      )
    }

    return new OrganizationName(trimmed)
  }

  getValue(): string {
    return this.value
  }

  equals(other: OrganizationName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
