/**
 * Value Object que encapsula las reglas de política de login.
 * Esto permite que las reglas sean configurables y no estén hardcodeadas en la entidad.
 */
export class LoginPolicy {
  constructor(
    public readonly maxAttempts: number = 3,
    public readonly lockDurationMinutes: number = 30,
  ) {}

  /**
   * Determina si los intentos fallidos exceden el máximo permitido.
   */
  shouldLockAccount(failedAttempts: number): boolean {
    return failedAttempts >= this.maxAttempts
  }

  /**
   * Calcula la fecha hasta la cual la cuenta debe estar bloqueada.
   */
  calculateLockUntil(): Date {
    const lockUntil = new Date()
    lockUntil.setMinutes(lockUntil.getMinutes() + this.lockDurationMinutes)
    return lockUntil
  }

  /**
   * Política por defecto del sistema.
   */
  static default(): LoginPolicy {
    return new LoginPolicy(3, 30)
  }

  /**
   * Política estricta para usuarios con permisos elevados.
   */
  static strict(): LoginPolicy {
    return new LoginPolicy(2, 60)
  }

  /**
   * Política relajada para desarrollo/testing.
   */
  static relaxed(): LoginPolicy {
    return new LoginPolicy(5, 15)
  }
}
