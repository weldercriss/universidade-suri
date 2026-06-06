import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';
import { IsInt, Min, IsOptional, IsString, IsNotEmpty, Matches } from 'class-validator';

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

class CreateXpRuleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, { message: 'Identificador deve conter apenas letras minúsculas, números e underscores' })
  action!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  xpValue!: number;

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

  @Post('admin/gamification/rules')
  @UseGuards(AuthGuard('jwt'))
  async createRule(@Req() req: any, @Body() dto: CreateXpRuleDto) {
    if (!req.user.isAdmin) throw new ForbiddenException();

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

  @Delete('admin/gamification/rules/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Req() req: any, @Param('id') id: string) {
    if (!req.user.isAdmin) throw new ForbiddenException();

    const existing = await this.prisma.xpRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Regra não encontrada');

    await this.prisma.xpRule.delete({ where: { id } });
  }
}
