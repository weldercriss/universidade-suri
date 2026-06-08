import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class AdminGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRules(user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.prisma.groupRule.findMany({ orderBy: [{ groupType: 'asc' }, { minXp: 'asc' }] });
  }

  async createRule(user: any, body: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const { groupType, tier, minXp, maxXp } = body;
    if (!groupType || !tier || minXp === undefined) {
      throw new BadRequestException('groupType, tier e minXp são obrigatórios');
    }
    return this.prisma.groupRule.create({
      data: { groupType, tier, minXp: Number(minXp), maxXp: maxXp != null ? Number(maxXp) : null },
    });
  }

  async updateRule(user: any, id: string, body: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const rule = await this.prisma.groupRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    return this.prisma.groupRule.update({
      where: { id },
      data: {
        groupType: body.groupType ?? rule.groupType,
        tier: body.tier ?? rule.tier,
        minXp: body.minXp !== undefined ? Number(body.minXp) : rule.minXp,
        maxXp: body.maxXp !== undefined ? (body.maxXp != null ? Number(body.maxXp) : null) : rule.maxXp,
      },
    });
  }

  async deleteRule(user: any, id: string) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const rule = await this.prisma.groupRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    await this.prisma.groupRule.delete({ where: { id } });
    return { message: 'Regra removida' };
  }

  async listGroupUsers(user: any, groupType?: string, tier?: string) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');

    const where: any = { isAdmin: false };
    if (groupType) where.groupType = groupType;
    if (tier) where.tier = tier;

    return this.prisma.profile.findMany({
      where,
      orderBy: { xp: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        groupType: true,
        tier: true,
        xp: true,
        level: true,
        isActive: true,
        business: true,
        createdAt: true,
      },
    });
  }

  async getDistribution(user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');

    const rows = await this.prisma.profile.groupBy({
      by: ['groupType', 'tier'],
      where: { isAdmin: false },
      _count: { id: true },
      orderBy: [{ groupType: 'asc' }],
    });

    return rows.map((r) => ({
      groupType: r.groupType,
      tier: r.tier,
      count: r._count.id,
    }));
  }
}
