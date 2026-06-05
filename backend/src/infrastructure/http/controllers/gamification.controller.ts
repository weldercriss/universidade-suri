import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

class UpdateXpRuleDto {
  @IsInt()
  @Min(0)
  xpValue!: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

@Controller()
export class GamificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('gamification/rules')
  @UseGuards(AuthGuard('jwt'))
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

  @Put('admin/gamification/rules/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateRule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateXpRuleDto,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException();

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
}
