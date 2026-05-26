import { Injectable, OnModuleInit } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { PgService } from '../pg.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PgUserRepository implements IUserRepository, OnModuleInit {
  private memoryStore: Map<string, User> = new Map();

  constructor(private readonly pg: PgService) {}

  async onModuleInit() {
    // Seed initial users into in-memory store for fallback mode
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('SuriAdmin123', salt);
    
    // Seed Admin
    const admin = new User(
      'u_admin',
      'Administrador Suri',
      'admin@suri.com',
      adminHash,
      'AD',
      'vip',
      'VIP PLUS',
      4820,
      7,
      true,
      new Date()
    );
    this.memoryStore.set(admin.id, admin);

    // Seed student (VIP)
    const vipUser = new User(
      'u_demo',
      'Marina Costa',
      'marina@nimbus.io',
      await bcrypt.hash('123456', salt),
      'MC',
      'vip',
      'VIP PLUS',
      4820,
      7,
      false,
      new Date()
    );
    this.memoryStore.set(vipUser.id, vipUser);
  }

  private mapRowToEntity(row: any): User {
    return new User(
      row.id,
      row.name,
      row.email,
      row.password_hash,
      row.avatar_url,
      row.group_type as 'vip' | 'embaixador' | 'admin',
      row.tier,
      row.xp || 0,
      row.level || 1,
      !!row.is_admin,
      row.created_at,
    );
  }

  async findById(id: string): Promise<User | null> {
    if (this.pg.isFallbackMode) {
      return this.memoryStore.get(id) || null;
    }
    const rows = await this.pg.query('SELECT * FROM profiles WHERE id = $1', [id]);
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.pg.isFallbackMode) {
      return Array.from(this.memoryStore.values()).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    const rows = await this.pg.query('SELECT * FROM profiles WHERE email = $1', [email]);
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async create(user: User): Promise<User> {
    const id = user.id && user.id.length > 0 ? user.id : crypto.randomUUID();
    const newUser = new User(
      id,
      user.name,
      user.email,
      user.passwordHash,
      user.avatarUrl,
      user.groupType,
      user.tier,
      user.xp,
      user.level,
      user.isAdmin,
      user.createdAt
    );

    if (this.pg.isFallbackMode) {
      this.memoryStore.set(id, newUser);
      return newUser;
    }
    const rows = await this.pg.query(
      `INSERT INTO profiles (id, name, email, password_hash, avatar_url, group_type, tier, xp, level, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        newUser.id,
        newUser.name,
        newUser.email,
        newUser.passwordHash,
        newUser.avatarUrl,
        newUser.groupType,
        newUser.tier,
        newUser.xp,
        newUser.level,
        newUser.isAdmin,
      ],
    );
    return this.mapRowToEntity(rows[0]);
  }

  async update(user: User): Promise<User> {
    if (this.pg.isFallbackMode) {
      this.memoryStore.set(user.id, user);
      return user;
    }
    const rows = await this.pg.query(
      `UPDATE profiles 
       SET name = $2, avatar_url = $3, group_type = $4, tier = $5, xp = $6, level = $7
       WHERE id = $1
       RETURNING *`,
      [user.id, user.name, user.avatarUrl, user.groupType, user.tier, user.xp, user.level],
    );
    return this.mapRowToEntity(rows[0]);
  }

  async listAll(): Promise<User[]> {
    if (this.pg.isFallbackMode) {
      return Array.from(this.memoryStore.values()).sort((a, b) => b.xp - a.xp);
    }
    const rows = await this.pg.query('SELECT * FROM profiles ORDER BY xp DESC');
    return rows.map(r => this.mapRowToEntity(r));
  }

  async listLeaderboard(groupType?: string): Promise<User[]> {
    if (this.pg.isFallbackMode) {
      return Array.from(this.memoryStore.values())
        .filter(u => !u.isAdmin && u.xp >= 0 && (!groupType || u.groupType === groupType))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 50);
    }
    if (groupType && groupType !== 'all') {
      const rows = await this.pg.query(
        `SELECT * FROM profiles WHERE is_admin = false AND xp >= 0 AND group_type = $1 ORDER BY xp DESC LIMIT 50`,
        [groupType],
      );
      return rows.map(r => this.mapRowToEntity(r));
    }
    const rows = await this.pg.query(
      `SELECT * FROM profiles WHERE is_admin = false AND xp >= 0 ORDER BY xp DESC LIMIT 50`,
    );
    return rows.map(r => this.mapRowToEntity(r));
  }
}
