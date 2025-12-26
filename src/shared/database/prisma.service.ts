import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)
    super({ adapter })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /**
   * Método para limpiar la base de datos (útil para testing)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production')
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key !== '$connect' && key !== '$disconnect',
    )

    await Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this]
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany()
        }
      }),
    )
  }
}
