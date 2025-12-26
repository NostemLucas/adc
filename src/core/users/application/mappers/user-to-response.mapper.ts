/**
 * User to Response DTO Mapper
 *
 * Maps Domain User entities to UserResponseDto for API responses.
 * Centralizes the mapping logic to ensure consistency across all queries.
 */

import { User } from '../../domain/user'
import { UserResponseDto } from '../queries/get-user/user-response.dto'

export class UserToResponseMapper {
  /**
   * Convert a single Domain User to UserResponseDto
   */
  static toDto(user: User): UserResponseDto {
    return {
      id: user.id,
      names: user.names.getValue(),
      lastNames: user.lastNames.getValue(),
      fullName: user.fullName,
      email: user.email.getValue(),
      username: user.username.getValue(),
      ci: user.ci.getValue(),
      phone: user.phone?.getValue() || null,
      address: user.address?.getValue() || null,
      image: user.image?.getValue() || null,
      status: user.status,
      roles: user.roles, // Array de roles del usuario
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  /**
   * Convert an array of Domain Users to UserResponseDto[]
   */
  static toDtoArray(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toDto(user))
  }
}
