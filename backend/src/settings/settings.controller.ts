import { Controller, Get, Post, Patch, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { PhotoVisibilityDto } from '../infrastructure/http/dtos/auth.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Patch('photo-visibility')
  @UseGuards(AuthGuard('jwt'))
  async setPhotoVisibility(@Req() req: any, @Body() body: PhotoVisibilityDto) {
    return this.settingsService.setPhotoVisibility(req.user, body);
  }

  @Post('logos')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Formato de imagem não suportado. Use JPG, PNG, WEBP, GIF ou SVG.'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadLogo(@Req() req: any, @Body('key') key: string, @UploadedFile() file: Express.Multer.File) {
    return this.settingsService.uploadLogo(req.user, key, file);
  }
}
