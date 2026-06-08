import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateXpRuleDto, UpdateXpRuleDto } from './gamification.dto';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules() {
    const [xpRules, groupRules] = await Promise.all([
      this.prisma.xpRule.findMany({
        where: { isActive: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.groupRule.findMany({
        orderBy: [{ groupType: 'asc' }, { minXp: 'asc' }],
      }),
    ]);
    return { xpRules, groupRules };
  }

  async createRule(user: any, dto: CreateXpRuleDto) {
    if (!user.isAdmin) throw new ForbiddenException();

    const existing = await this.prisma.xpRule.findUnique({ where: { action: dto.action } });
    if (existing) throw new BadRequestException('Já existe uma regra com esse identificador');

    return this.prisma.xpRule.create({
      data: {
        action: dto.action,
        label: dto.label,
        description: dto.description,
        xpValue: dto.xpValue,
        icon: dto.icon ?? 'Zap',
      },
    });
  }

  async updateRule(user: any, id: string, dto: UpdateXpRuleDto) {
    if (!user.isAdmin) throw new ForbiddenException();

    const existing = await this.prisma.xpRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Regra não encontrada');

    return this.prisma.xpRule.update({
      where: { id },
      data: {
        xpValue: dto.xpValue,
        ...(dto.label && { label: dto.label }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });
  }

  async deleteRule(user: any, id: string) {
    if (!user.isAdmin) throw new ForbiddenException();

    const existing = await this.prisma.xpRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Regra não encontrada');

    await this.prisma.xpRule.delete({ where: { id } });
  }
}
