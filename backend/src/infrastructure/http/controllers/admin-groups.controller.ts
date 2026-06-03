import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, Req,
  ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';

@Controller('admin/groups')
export class AdminGroupsController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Regras de grupo ────────────────────────────────────────────────────────

  @Get('rules')
  @UseGuards(AuthGuard('jwt'))
  async listRules(@Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.prisma.groupRule.findMany({ orderBy: [{ groupType: 'asc' }, { minXp: 'asc' }] });
  }

  @Post('rules')
  @UseGuards(AuthGuard('jwt'))
  async createRule(@Req() req: any, @Body() body: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const { groupType, tier, minXp, maxXp } = body;
    if (!groupType || !tier || minXp === undefined) {
      throw new BadRequestException('groupType, tier e minXp são obrigatórios');
    }
    return this.prisma.groupRule.create({
      data: { groupType, tier, minXp: Number(minXp), maxXp: maxXp != null ? Number(maxXp) : null },
    });
  }

  @Put('rules/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateRule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  @Delete('rules/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteRule(@Req() req: any, @Param('id') id: string) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const rule = await this.prisma.groupRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra não encontrada');
    await this.prisma.groupRule.delete({ where: { id } });
    return { message: 'Regra removida' };
  }

  // ─── Listar usuários com filtros de grupo/tier ──────────────────────────────

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async listGroupUsers(
    @Req() req: any,
    @Query('groupType') groupType?: string,
    @Query('tier') tier?: string,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const where: any = { isAdmin: false };
    if (groupType) where.groupType = groupType;
    if (tier) where.tier = tier;

    const users = await this.prisma.profile.findMany({
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

    return users;
  }

  // ─── Distribuição de usuários por grupo/subgrupo ────────────────────────────

  @Get('distribution')
  @UseGuards(AuthGuard('jwt'))
  async getDistribution(@Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

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
