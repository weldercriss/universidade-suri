import { Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  private readonly logger = new Logger(PrismaUserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<User[]> {
    try {
      const rows = await this.prisma.profile.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((row) => this.mapRowToEntity(row));
    } catch (e) {
      this.logger.error('Error listing all users', e);
      return [];
    }
  }

  async listLeaderboard(groupType?: string): Promise<User[]> {
    try {
      const where: any = {
        isAdmin: false,
        isActive: true,
        xp: { gt: 0 },
      };
      if (groupType && groupType !== 'all') {
        where.groupType = groupType;
      }
      const rows = await this.prisma.profile.findMany({
        where,
        orderBy: { xp: 'desc' },
        take: 50,
      });
      return rows.map((row) => this.mapRowToEntity(row));
    } catch (e) {
      this.logger.error('Error listing leaderboard', e);
      return [];
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const row = await this.prisma.profile.findUnique({
        where: { email },
      });
      if (!row) return null;
      return this.mapRowToEntity(row);
    } catch (e) {
      this.logger.error('Error finding user by email', e);
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.prisma.profile.findUnique({
        where: { id },
      });
      if (!row) return null;
      return this.mapRowToEntity(row);
    } catch (e) {
      this.logger.error('Error finding user by id', e);
      return null;
    }
  }

  async create(user: User): Promise<User> {
    try {
      const row = await this.prisma.profile.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          groupType: user.groupType,
          tier: user.tier,
          xp: user.xp,
          level: user.level,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          profileImage: user.profileImage,
          business: user.business,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      });
      return this.mapRowToEntity(row);
    } catch (e) {
      this.logger.error('Error creating user', e);
      throw e;
    }
  }

  async update(user: User): Promise<User> {
    try {
      const row = await this.prisma.profile.update({
        where: { id: user.id },
        data: {
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          groupType: user.groupType,
          tier: user.tier,
          xp: user.xp,
          level: user.level,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          profileImage: user.profileImage,
          business: user.business,
          phone: user.phone,
        },
      });
      return this.mapRowToEntity(row);
    } catch (e) {
      this.logger.error('Error updating user', e);
      throw e;
    }
  }

  private mapRowToEntity(row: any): User {
    return new User(
      row.id,
      row.name,
      row.email,
      row.passwordHash,
      row.groupType,
      row.tier,
      row.xp,
      row.level,
      row.isAdmin,
      new Date(row.createdAt),
      row.isActive ?? true,
      row.profileImage ?? null,
      row.business || '',
      row.phone || null,
    );
  }
}
