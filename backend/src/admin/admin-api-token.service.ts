import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CreateApiTokenDto } from '../infrastructure/http/dtos/api-token.dto';

@Injectable()
export class AdminApiTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async listTokens(user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

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

  async createToken(user: any, body: CreateApiTokenDto) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    const plainToken = `suri_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    await this.prisma.apiToken.create({
      data: {
        name: body.name,
        tokenHash,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdById: user.id,
      },
    });

    return { token: plainToken };
  }

  async toggleToken(user: any, id: string) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    const existing = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Token não encontrado');

    return this.prisma.apiToken.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  async deleteToken(user: any, id: string) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso restrito para administradores');

    const existing = await this.prisma.apiToken.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Token não encontrado');

    await this.prisma.apiToken.delete({ where: { id } });

    return { message: 'Token revogado com sucesso' };
  }
}
