# Value Objects - User Domain

Value Objects (VOs) para el dominio de usuarios. Encapsulan validación, comportamiento y garantizan inmutabilidad.

## 📦 Value Objects Disponibles

### 1. Email
Encapsula un email válido con comportamiento rico.

```typescript
const email = Email.create('john@example.com')

email.getValue()           // 'john@example.com'
email.getDomain()          // 'example.com'
email.getLocalPart()       // 'john'
email.isPersonalEmail()    // false
email.isCorporateEmail()   // true
```

**Validaciones:**
- Formato válido (RFC 5322 simplificado)
- Normalización automática (lowercase, trim)

### 2. CI (Cédula de Identidad)
Encapsula un CI boliviano con información de departamento.

```typescript
const ci = CI.create('12345678')

ci.getValue()           // '12345678'
ci.getDepartment()      // 'La Paz'
ci.getExtension()       // '12'
ci.getFormatted()       // '1234567-8 LP'
ci.getDepartmentCode()  // 'LP'
```

**Validaciones:**
- Formato: 7-10 dígitos numéricos
- Normalización automática (solo dígitos)

**Departamentos soportados:**
- 1: La Paz (LP)
- 2: Oruro (OR)
- 3: Potosí (PT)
- 4: Cochabamba (CB)
- 5: Chuquisaca (CH)
- 6: Tarija (TJ)
- 7: Santa Cruz (SC)
- 8: Beni (BE)
- 9: Pando (PD)

### 3. Phone
Encapsula un teléfono boliviano con información de operador.

```typescript
const phone = Phone.create('70123456')

phone.getValue()           // '70123456'
phone.getFormatted()       // '70-12-3456'
phone.getInternational()   // '+591 70123456'
phone.isMobile()           // true
phone.isLandline()         // false
phone.getCarrier()         // 'Entel'
```

**Validaciones:**
- Formato: 8 dígitos numéricos
- Primer dígito válido: 2, 3, 4, 6, 7
- Normalización automática (solo dígitos)

**Operadores soportados:**
- 60-63: Viva
- 70-73: Entel
- 74-79: Tigo

## 🎯 Ventajas de Value Objects

### ✅ Validación Automática
```typescript
// ❌ ANTES: Validación manual, posibilidad de email inválido
user.email = 'invalid-email'  // Sin validación

// ✅ AHORA: Validación automática, imposible tener email inválido
user.email = Email.create('invalid-email')  // Throw InvalidEmailFormatException
```

### ✅ Type Safety
```typescript
// ❌ ANTES: Podías asignar CI a email por error
user.email = user.ci  // Ambos son strings, compila pero está mal

// ✅ AHORA: TypeScript te protege
user.email = user.ci  // ERROR de TypeScript: CI no es Email
```

### ✅ Comportamiento Rico
```typescript
// ❌ ANTES: Lógica esparcida por el código
const domain = user.email.split('@')[1]
const isPersonal = ['gmail.com', 'hotmail.com'].includes(domain)

// ✅ AHORA: Comportamiento encapsulado
const isPersonal = user.email.isPersonalEmail()
```

### ✅ Inmutabilidad
```typescript
// Value Objects son inmutables, se reemplazan
const email1 = Email.create('old@example.com')
const email2 = Email.create('new@example.com')

// No puedes modificar email1, solo reemplazarlo
user.email = email2
```

## 🏗️ Cómo usar en User Entity

### Crear Usuario
```typescript
const user = User.create({
  email: 'john@example.com',  // ← Recibe string
  ci: '12345678',             // ← Recibe string
  phone: '70123456',          // ← Recibe string
  // ...
})

// Internamente, User.create() convierte a VOs:
// this.email = Email.create(data.email)
// this.ci = CI.create(data.ci)
// this.phone = Phone.create(data.phone)
```

### Acceder a Valores
```typescript
// Para obtener el string original
const emailString = user.email.getValue()     // 'john@example.com'
const ciString = user.ci.getValue()           // '12345678'
const phoneString = user.phone?.getValue()    // '70123456'

// Para usar comportamiento
const domain = user.email.getDomain()         // 'example.com'
const dept = user.ci.getDepartment()          // 'La Paz'
const carrier = user.phone?.getCarrier()      // 'Entel'
```

### Actualizar Usuario
```typescript
user.update({
  email: 'new@example.com',  // ← Recibe string, se convierte a VO
  ci: '87654321',
})
```

## 🔄 Mapeo en Repository

### De Domain → Prisma (Persistir)
```typescript
async create(user: User): Promise<User> {
  await this.prisma.user.create({
    data: {
      email: user.email.getValue(),    // VO → string
      ci: user.ci.getValue(),          // VO → string
      phone: user.phone?.getValue(),   // VO → string
      // ...
    }
  })
}
```

### De Prisma → Domain (Leer)
```typescript
private toDomain(prismaUser): User {
  return User.fromPersistence({
    email: prismaUser.email,  // string → VO (automático en fromPersistence)
    ci: prismaUser.ci,
    phone: prismaUser.phone,
    // ...
  })
}
```

## 🧪 Testing

Los Value Objects son fáciles de testear:

```typescript
describe('Email Value Object', () => {
  it('should create valid email', () => {
    const email = Email.create('test@example.com')
    expect(email.getValue()).toBe('test@example.com')
  })

  it('should normalize email', () => {
    const email = Email.create('  TEST@Example.COM  ')
    expect(email.getValue()).toBe('test@example.com')
  })

  it('should throw on invalid email', () => {
    expect(() => Email.create('invalid')).toThrow(InvalidEmailFormatException)
  })

  it('should detect personal emails', () => {
    const personal = Email.create('user@gmail.com')
    expect(personal.isPersonalEmail()).toBe(true)

    const corporate = Email.create('user@company.com')
    expect(corporate.isPersonalEmail()).toBe(false)
  })
})
```

## 📋 Cuándo crear un Value Object

### ✅ Crear VO cuando:
- El valor tiene **formato específico** (email, CI, phone)
- Necesitas **validación compleja**
- El valor tiene **comportamiento** (getDomain, getCarrier)
- Quieres **type safety** (no confundir Email con CI)
- El valor es **reutilizable** (Email se usa en User, Company, etc.)

### ❌ NO crear VO cuando:
- El valor es muy **simple** (names, address)
- No tiene **reglas de validación** complejas
- Es solo un **string arbitrario**

## 🚀 Extendiendo Value Objects

Si necesitas más comportamiento, simplemente agrégalo:

```typescript
// En email.vo.ts
export class Email {
  // ... métodos existentes

  // Nuevo comportamiento
  isFromDomain(domain: string): boolean {
    return this.getDomain() === domain
  }

  obfuscate(): string {
    const [local, domain] = this.value.split('@')
    return `${local[0]}***@${domain}`
  }
}

// Uso
if (user.email.isFromDomain('company.com')) {
  // Es empleado
}

const hidden = user.email.obfuscate()  // 'j***@company.com'
```

## 📚 Recursos

- [Value Objects - DDD](https://martinfowler.com/bliki/ValueObject.html)
- [Value Objects en TypeScript](https://khalilstemmler.com/articles/typescript-value-object/)
