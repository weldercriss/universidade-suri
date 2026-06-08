import { Controller, Post, Body, Get, Put, Patch, Delete, Param, Query, UseGuards, Req, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { User } from '../domain/entities/user.entity';
import { LoginDto, SignupDto } from '../infrastructure/http/dtos/auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login com e-mail e senha corporativo — retorna JWT e dados do usuário' })
  @ApiResponse({ status: 201, description: '{ token, user }' })
  @ApiResponse({ status: 401, description: 'Email/senha inválidos ou conta desativada' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @ApiOperation({ summary: 'Cadastro de novo usuário — padrão embaixador/Embaixador Voice, ou admin se group=admin' })
  @ApiResponse({ status: 201, description: '{ token, user }' })
  @ApiResponse({ status: 400, description: 'E-mail já cadastrado' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado — inclui isFirstLogin (sem ModuleProgress)' })
  @ApiResponse({ status: 200, description: 'Dados do usuário com isFirstLogin' })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user as User);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza nome, avatar e profileImage do usuário autenticado (admin pode alterar level)' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.authService.updateProfile(req.user as User, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lista todos os usuários da plataforma' })
  @ApiResponse({ status: 200, description: 'Array de usuários com grupo, tier, XP e empresa' })
  @ApiResponse({ status: 401, description: 'Apenas administradores' })
  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async listAllUsers(@Req() req: any) {
    return this.authService.listAllUsers(req.user as User);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza dados de qualquer usuário — grupo, tier, XP, level, isActive, empresa' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Put('users/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.authService.updateUser(req.user as User, id, body);
  }

  @Patch('users/:id/toggle-active')
  @UseGuards(AuthGuard('jwt'))
  async toggleUserActive(@Req() req: any, @Param('id') id: string) {
    return this.authService.toggleUserActive(req.user as User, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Exclui permanentemente um usuário e todos os dados vinculados (certificados, progresso, etc)' })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Delete('users/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    return this.authService.deleteUser(req.user as User, id);
  }

  @Post('me/avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.authService.uploadAvatar(req.user as User, file);
  }

  @ApiOperation({ summary: 'Solicita token de redefinição de senha — retorna mensagem genérica' })
  @ApiResponse({ status: 201, description: 'Mensagem de confirmação' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body);
  }

  @ApiOperation({ summary: 'Redefine senha com token válido' })
  @ApiResponse({ status: 201, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  async getLeaderboard(@Req() req: any, @Query('group') group?: string) {
    return this.authService.getLeaderboard(req.user as User, group);
  }
}
