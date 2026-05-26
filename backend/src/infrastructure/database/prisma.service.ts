import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma conectado ao banco de dados com sucesso!');
    } catch (error) {
      this.logger.error('⚠️ Erro ao conectar o Prisma ao banco de dados', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
