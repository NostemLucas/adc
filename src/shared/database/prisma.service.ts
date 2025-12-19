import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
      (key) => key[0] !== '_' && key !== '$connect' && key !== '$disconnect'
    )

    await Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this]
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany()
        }
      })
    )
  }
}
