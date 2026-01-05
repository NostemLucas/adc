# Ejemplo Práctico: Protección de Endpoints

## Caso de Uso: Sistema de Reportes

Vamos a proteger los endpoints de reportes para que:
1. **Usuarios Internos** (Admin, Gerente, Auditor): Gestión completa según su rol
2. **Clientes**: Solo lectura de sus propios reportes

## Ejemplo Completo de Controller

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

// Importar guards y decorators del auth
import {
  JwtAuthGuard,
  RolesGuard,
  InternalOnlyGuard,
  Roles,
  InternalOnly,
  CurrentUser,
  OrganizationId,
  Role,
} from '@core/auth'
import type { JwtPayload } from '@core/auth/interfaces'

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard) // Todos los endpoints requieren autenticación
export class ReportsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * ENDPOINT 1: Ver mis reportes
   *
   * - Internos: Ven todos los reportes (o según su rol)
   * - Clientes: Solo ven reportes de su organización
   */
  @Get()
  @ApiOperation({
    summary: 'Listar reportes',
    description: 'Clientes solo ven sus reportes. Internos ven según su rol.',
  })
  async listReports(
    @CurrentUser() user: JwtPayload,
    @OrganizationId() organizationId?: string,
  ) {
    // Si es CLIENTE (tiene organizationId)
    if (organizationId) {
      return this.queryBus.execute(
        new ListReportsByOrganizationQuery(organizationId),
      )
    }

    // Si es USUARIO INTERNO (tiene roles)
    if (user.roles && user.roles.length > 0) {
      // Según el rol, filtrar reportes
      // Por ejemplo, auditores solo ven reportes que crearon
      if (user.currentRole === Role.AUDITOR) {
        return this.queryBus.execute(new ListReportsByCreatorQuery(user.sub))
      }

      // Admin y Gerente ven todos
      return this.queryBus.execute(new ListAllReportsQuery())
    }

    throw new ForbiddenException('Usuario sin perfil válido')
  }

  /**
   * ENDPOINT 2: Ver detalle de un reporte
   *
   * - Internos: Pueden ver cualquier reporte según permisos
   * - Clientes: Solo si el reporte pertenece a su organización
   */
  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de un reporte' })
  async getReport(
    @Param('id') reportId: string,
    @CurrentUser() user: JwtPayload,
    @OrganizationId() organizationId?: string,
  ) {
    const report = await this.queryBus.execute(
      new GetReportByIdQuery(reportId),
    )

    // Si es CLIENTE, verificar que el reporte sea de su organización
    if (organizationId && report.organizationId !== organizationId) {
      throw new ForbiddenException(
        'No tienes acceso a reportes de otras organizaciones',
      )
    }

    return report
  }

  /**
   * ENDPOINT 3: Crear reporte
   *
   * Solo usuarios INTERNOS con roles específicos pueden crear
   */
  @Post()
  @Roles(Role.ADMINISTRADOR, Role.GERENTE, Role.AUDITOR)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Crear nuevo reporte (Solo internos: Admin, Gerente, Auditor)',
  })
  async createReport(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new CreateReportCommand({
        ...dto,
        createdBy: user.sub,
      }),
    )
  }

  /**
   * ENDPOINT 4: Actualizar reporte
   *
   * Solo Admin y Gerente pueden actualizar
   */
  @Put(':id')
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar reporte (Solo Admin y Gerente)' })
  async updateReport(
    @Param('id') reportId: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.commandBus.execute(
      new UpdateReportCommand(reportId, dto),
    )
  }

  /**
   * ENDPOINT 5: Eliminar reporte
   *
   * Solo Admin puede eliminar
   */
  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Eliminar reporte (Solo Administrador)' })
  async deleteReport(@Param('id') reportId: string) {
    return this.commandBus.execute(new DeleteReportCommand(reportId))
  }

  /**
   * ENDPOINT 6: Exportar reporte a PDF
   *
   * - Internos con permiso: Admin, Gerente
   * - Clientes: Solo sus propios reportes
   */
  @Get(':id/export')
  @ApiOperation({ summary: 'Exportar reporte a PDF' })
  async exportReport(
    @Param('id') reportId: string,
    @CurrentUser() user: JwtPayload,
    @OrganizationId() organizationId?: string,
  ) {
    const report = await this.queryBus.execute(
      new GetReportByIdQuery(reportId),
    )

    // Validación para CLIENTES
    if (organizationId) {
      if (report.organizationId !== organizationId) {
        throw new ForbiddenException(
          'No puedes exportar reportes de otras organizaciones',
        )
      }
    }

    // Validación para INTERNOS
    if (user.roles) {
      // Verificar si tiene permiso REPORTS:EXPORT
      const canExport = [Role.ADMINISTRADOR, Role.GERENTE].includes(
        user.currentRole as Role,
      )

      if (!canExport) {
        throw new ForbiddenException(
          'No tienes permisos para exportar reportes',
        )
      }
    }

    return this.commandBus.execute(new ExportReportCommand(reportId))
  }

  /**
   * ENDPOINT 7: Aprobar reporte
   *
   * Solo usuarios INTERNOS pueden aprobar (Admin y Gerente)
   */
  @Post(':id/approve')
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Aprobar reporte (Solo Admin y Gerente)' })
  async approveReport(
    @Param('id') reportId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new ApproveReportCommand(reportId, user.sub),
    )
  }

  /**
   * ENDPOINT 8: Endpoint exclusivo para internos
   *
   * Los clientes recibirán 403 Forbidden automáticamente
   */
  @Post('bulk-delete')
  @InternalOnly()
  @UseGuards(InternalOnlyGuard)
  @Roles(Role.ADMINISTRADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Eliminar múltiples reportes (Solo Admin - Solo Internos)',
  })
  async bulkDeleteReports(@Body() dto: BulkDeleteReportsDto) {
    return this.commandBus.execute(new BulkDeleteReportsCommand(dto.ids))
  }
}
```

## Tabla de Permisos por Endpoint

| Endpoint | Admin | Gerente | Auditor | Cliente |
|----------|-------|---------|---------|---------|
| `GET /reports` | ✅ Todos | ✅ Todos | ✅ Propios | ✅ Solo org |
| `GET /reports/:id` | ✅ | ✅ | ✅ | ✅ Solo org |
| `POST /reports` | ✅ | ✅ | ✅ | ❌ |
| `PUT /reports/:id` | ✅ | ✅ | ❌ | ❌ |
| `DELETE /reports/:id` | ✅ | ❌ | ❌ | ❌ |
| `GET /reports/:id/export` | ✅ | ✅ | ❌ | ✅ Solo org |
| `POST /reports/:id/approve` | ✅ | ✅ | ❌ | ❌ |
| `POST /reports/bulk-delete` | ✅ | ❌ | ❌ | ❌ |

## Aplicar en tus Controladores Actuales

### 1. Internal Users Controller

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import {
  JwtAuthGuard,
  InternalOnlyGuard,
  RolesGuard,
  InternalOnly,
  Roles,
  Role,
} from '@core/auth'

@Controller('internal-users')
@UseGuards(JwtAuthGuard, InternalOnlyGuard)
@InternalOnly() // Todos los endpoints solo para internos
export class InternalUsersController {

  @Post()
  @Roles(Role.ADMINISTRADOR) // Solo admin puede crear usuarios internos
  @UseGuards(RolesGuard)
  async createInternalUser(@Body() dto: CreateInternalUserDto) {
    // ...
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.GERENTE) // Admin y Gerente pueden ver
  @UseGuards(RolesGuard)
  async listInternalUsers() {
    // ...
  }
}
```

### 2. External Profiles Controller

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import {
  JwtAuthGuard,
  InternalOnlyGuard,
  RolesGuard,
  InternalOnly,
  Roles,
  Role,
  OrganizationId,
  CurrentUser,
} from '@core/auth'
import type { JwtPayload } from '@core/auth/interfaces'

@Controller('external-profiles')
@UseGuards(JwtAuthGuard)
export class ExternalProfilesController {

  // Solo internos pueden crear perfiles externos
  @Post()
  @InternalOnly()
  @UseGuards(InternalOnlyGuard)
  @Roles(Role.ADMINISTRADOR)
  @UseGuards(RolesGuard)
  async createExternalProfile(@Body() dto: CreateExternalProfileDto) {
    // ...
  }

  // Clientes pueden ver su propio perfil, internos pueden ver todos
  @Get('me')
  async getMyProfile(
    @CurrentUser() user: JwtPayload,
    @OrganizationId() orgId?: string,
  ) {
    if (orgId) {
      // Cliente: retornar su perfil
      return this.queryBus.execute(new GetExternalProfileByUserIdQuery(user.sub))
    }

    throw new ForbiddenException('Endpoint solo para clientes')
  }

  // Solo internos pueden listar todos los perfiles
  @Get()
  @InternalOnly()
  @UseGuards(InternalOnlyGuard)
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UseGuards(RolesGuard)
  async listExternalProfiles() {
    // ...
  }
}
```

### 3. Audits Controller

```typescript
import { Controller, UseGuards, Query } from '@nestjs/common'
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
  CurrentUser,
  OrganizationId,
} from '@core/auth'
import type { JwtPayload } from '@core/auth/interfaces'

@Controller('audits')
@UseGuards(JwtAuthGuard)
export class AuditsController {

  @Get()
  async listAudits(
    @CurrentUser() user: JwtPayload,
    @OrganizationId() orgId?: string,
    @Query('status') status?: string,
  ) {
    // CLIENTE: Solo auditorías de su organización
    if (orgId) {
      return this.queryBus.execute(
        new ListAuditsByOrganizationQuery(orgId, status),
      )
    }

    // INTERNO: Según rol
    if (user.currentRole === Role.AUDITOR) {
      // Auditor: solo auditorías asignadas a él
      return this.queryBus.execute(
        new ListAuditsByAuditorQuery(user.sub, status),
      )
    }

    // Admin y Gerente: todas las auditorías
    return this.queryBus.execute(new ListAllAuditsQuery(status))
  }

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UseGuards(RolesGuard)
  async createAudit(@Body() dto: CreateAuditDto) {
    // ...
  }

  @Post(':id/approve')
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UseGuards(RolesGuard)
  async approveAudit(@Param('id') id: string) {
    // ...
  }

  @Post(':id/assign')
  @Roles(Role.ADMINISTRADOR, Role.GERENTE)
  @UseGuards(RolesGuard)
  async assignAuditor(
    @Param('id') auditId: string,
    @Body() dto: AssignAuditorDto,
  ) {
    // ...
  }
}
```

## Checklist de Implementación

### Para cada endpoint, pregúntate:

1. ✅ **¿Requiere autenticación?**
   - Sí → `@UseGuards(JwtAuthGuard)`

2. ✅ **¿Solo para usuarios internos?**
   - Sí → `@InternalOnly()` + `@UseGuards(InternalOnlyGuard)`

3. ✅ **¿Requiere roles específicos?**
   - Sí → `@Roles(Role.ADMIN, Role.GERENTE)` + `@UseGuards(RolesGuard)`

4. ✅ **¿Los clientes pueden acceder?**
   - Sí → Filtrar datos por `@OrganizationId()`

5. ✅ **¿Hay lógica diferente para internos vs clientes?**
   - Sí → Usar `@CurrentUser()` para verificar `roles` vs `organizationId`

## Testing

```typescript
describe('ReportsController', () => {
  describe('Cliente', () => {
    it('puede ver solo sus reportes', async () => {
      const token = await loginAsClient('cliente@org.com')

      const response = await request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.every(r => r.organizationId === 'org-123')).toBe(true)
    })

    it('NO puede crear reportes', async () => {
      const token = await loginAsClient('cliente@org.com')

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Reporte' })
        .expect(403)
    })

    it('NO puede acceder a reportes de otras organizaciones', async () => {
      const token = await loginAsClient('cliente@org.com')

      await request(app.getHttpServer())
        .get('/reports/report-from-other-org')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
    })
  })

  describe('Auditor', () => {
    it('puede crear reportes', async () => {
      const token = await loginAsAuditor('auditor@system.com')

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Reporte' })
        .expect(201)
    })

    it('NO puede eliminar reportes', async () => {
      const token = await loginAsAuditor('auditor@system.com')

      await request(app.getHttpServer())
        .delete('/reports/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
    })
  })

  describe('Admin', () => {
    it('puede eliminar reportes', async () => {
      const token = await loginAsAdmin('admin@system.com')

      await request(app.getHttpServer())
        .delete('/reports/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
    })
  })
})
```

## Resumen Visual

```
┌─────────────────────────────────────────────────────┐
│              Request con JWT Token                   │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │     JwtAuthGuard           │
        │  (Valida token y extrae    │
        │   user en request.user)    │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │ ¿Tiene 'roles' en payload? │
        └───┬──────────────────┬─────┘
            │                  │
      SÍ ───┤                  ├─── NO
            │                  │
    USUARIO INTERNO      USUARIO EXTERNO
    (Admin/Ger/Aud)         (Cliente)
            │                  │
            │                  │
    ┌───────▼────────┐  ┌──────▼────────┐
    │ RolesGuard     │  │ OrganizationId│
    │ InternalOnly   │  │ filter        │
    └───────┬────────┘  └──────┬────────┘
            │                  │
            └────────┬─────────┘
                     │
           ┌─────────▼──────────┐
           │   Controller       │
           │   Endpoint Logic   │
           └────────────────────┘
```
