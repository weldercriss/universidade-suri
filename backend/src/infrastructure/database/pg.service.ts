import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);
  private pool!: Pool;
  public isFallbackMode = false;

  async onModuleInit() {
    this.pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'unisuri_db',
      connectionTimeoutMillis: 2000,
    });

    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('✅ PostgreSQL conectado com sucesso!');
    } catch (err) {
      this.isFallbackMode = true;
      this.logger.warn('⚠️ PostgreSQL recusou conexão (ECONNREFUSED).');
      this.logger.warn('🚀 Ativando Banco de Dados em Memória (MemoryStore) para funcionamento imediato!');
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (this.isFallbackMode) {
      // In-memory queries are intercepted in repositories
      return [];
    }
    const res = await this.pool.query(text, params);
    return res.rows;
  }

  async getClient(): Promise<PoolClient | null> {
    if (this.isFallbackMode) return null;
    return this.pool.connect();
  }
}
