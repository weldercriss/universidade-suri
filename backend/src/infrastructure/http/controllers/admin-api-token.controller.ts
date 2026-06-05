import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateApiTokenDto } from '../dtos/api-token.dto';

@ApiTags('admin-api-tokens')
@ApiBearerAuth()
@Controller('admin/api-tokens')
@UseGuards(AuthGuard('jwt'))
export class AdminApiTokenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listTokens(@Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    return this.prisma.apiToken.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async createToken(@Req() req: any, @Body() body: CreateApiTokenDto) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    const plainToken = `suri_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    await this.prisma.apiToken.create({
      data: {
        name: body.name,
        tokenHash,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdById: req.user.id,
      },
    });

    return { token: plainToken };
  }

  @Patch(':id/toggle')
  async toggleToken(@Req() req: any, @Param('id') id: string) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    const existing = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Token não encontrado');

    const updated = await this.prisma.apiToken.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return updated;
  }

  @Delete(':id')
  async deleteToken(@Req() req: any, @Param('id') id: string) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    const existing = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Token não encontrado');

    await this.prisma.apiToken.delete({ where: { id } });

    return { message: 'Token revogado com sucesso' };
  }
}
