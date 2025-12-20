import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { TransactionContext } from './transaction-context.service'

@Global()
@Module({
  providers: [PrismaService, TransactionContext],
  exports: [PrismaService, TransactionContext],
})
export class PrismaModule {}
