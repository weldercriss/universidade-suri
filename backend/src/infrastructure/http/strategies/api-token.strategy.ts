import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ApiTokenStrategy extends PassportStrategy(Strategy, 'api-token') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async validate(req: Request): Promise<{ type: string; tokenId: string }> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de API ausente');
    }

    const rawToken = authHeader.slice(7);

    // JWTs têm 3 partes separadas por ponto; tokens de API não
    if (rawToken.split('.').length === 3) {
      throw new UnauthorizedException('Token de API inválido');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash },
    });

    if (!apiToken) {
      throw new UnauthorizedException('Token de API inválido');
    }

    if (!apiToken.isActive) {
      throw new UnauthorizedException('Token de API desativado');
    }

    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de API expirado');
    }

    await this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    return { type: 'api-token', tokenId: apiToken.id };
  }
}
