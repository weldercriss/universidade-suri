import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PhotoVisibilityDto } from '../infrastructure/http/dtos/auth.dto';
import { SupabaseStorageService } from '../infrastructure/storage/supabase-storage.service';

const VALID_LOGO_KEYS = [
  'logo_expanded_light',
  'logo_expanded_dark',
  'logo_collapsed_light',
  'logo_collapsed_dark',
];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  async getPublicSettings() {
    try {
      const settings = await this.prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'logo_expanded_light',
              'logo_expanded_dark',
              'logo_collapsed_light',
              'logo_collapsed_dark',
              'show_user_photos',
            ],
          },
        },
      });

      const result: Record<string, string> = {};
      settings.forEach(s => {
        result[s.key] = s.value;
      });

      return result;
    } catch (e) {
      // Não derruba o boot do frontend em falha transitória de DB (ex.: cold-start)
      return {};
    }
  }

  async setPhotoVisibility(user: any, body: PhotoVisibilityDto) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Apenas administradores podem alterar esta configuração.');
    }

    const setting = await this.prisma.systemSetting.upsert({
      where: { key: 'show_user_photos' },
      update: { value: String(body.enabled) },
      create: { key: 'show_user_photos', value: String(body.enabled) },
    });

    return {
      key: setting.key,
      value: setting.value,
      message: body.enabled ? 'Fotos de perfil ativadas' : 'Fotos de perfil desativadas',
    };
  }

  async uploadLogo(user: any, key: string, file: Express.Multer.File) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Apenas administradores podem alterar os logotipos.');
    }
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

    if (!VALID_LOGO_KEYS.includes(key)) {
      throw new BadRequestException('Chave de logotipo inválida.');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${key}_${Date.now()}${ext}`;

    const imageUrl = await this.supabaseStorage.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      'logos'
    );

    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: imageUrl },
      create: { key, value: imageUrl },
    });

    return {
      key: setting.key,
      value: setting.value,
      message: 'Logotipo atualizado com sucesso',
    };
  }
}
