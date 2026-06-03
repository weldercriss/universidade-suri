import { Controller, Get, Post, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../../database/prisma.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('public')
  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'logo_expanded_light',
            'logo_expanded_dark',
            'logo_collapsed_light',
            'logo_collapsed_dark'
          ]
        }
      }
    });

    const result: Record<string, string> = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });

    return result;
  }

  @Post('logos')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'logos');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req: any, file, cb) => {
        const key = req.body.key || 'default';
        const ext = path.extname(file.originalname).toLowerCase();
        // timestamp to avoid caching issues when replacing
        cb(null, `${key}_${Date.now()}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Formato de imagem não suportado. Use JPG, PNG, WEBP, GIF ou SVG.'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadLogo(@Req() req: any, @Body('key') key: string, @UploadedFile() file: Express.Multer.File) {
    const user = req.user;
    if (!user.isAdmin) {
      throw new ForbiddenException('Apenas administradores podem alterar os logotipos.');
    }
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    
    const validKeys = [
      'logo_expanded_light',
      'logo_expanded_dark',
      'logo_collapsed_light',
      'logo_collapsed_dark'
    ];
    
    if (!validKeys.includes(key)) {
      throw new BadRequestException('Chave de logotipo inválida.');
    }

    const imageUrl = `/uploads/logos/${file.filename}`;
    
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
