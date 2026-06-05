import { Controller, Post, Body, Get, Put, Patch, Delete, Param, Query, UseGuards, Req, Inject, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as nodeCrypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto, SignupDto } from '../dtos/auth.dto';
import { SupabaseStorageService } from '../../storage/supabase-storage.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  @ApiOperation({ summary: 'Login com e-mail e senha corporativo — retorna JWT e dados do usuário' })
  @ApiResponse({ status: 201, description: '{ token, user }' })
  @ApiResponse({ status: 401, description: 'Email/senha inválidos ou conta desativada' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    const { email, password } = body;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desabilitada. Entre em contato com o administrador.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        group: user.isAdmin ? 'admin' : user.groupType,
        tier: user.tier,
        xp: user.xp,
        level: user.level,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        profileImage: user.profileImage,
      },
    };
  }

  @ApiOperation({ summary: 'Cadastro de novo usuário — padrão embaixador/Embaixador Voice, ou admin se group=admin' })
  @ApiResponse({ status: 201, description: '{ token, user }' })
  @ApiResponse({ status: 400, description: 'E-mail já cadastrado' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('signup')
  async signup(@Body() body: SignupDto) {
    const { name, email, password, group, tier, business, phone, newsletter } = body;
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isSignupAdmin = group === 'admin' || body.isAdmin === true;
    const resolvedGroup = (isSignupAdmin ? 'admin' : (group || 'embaixador')) as 'admin' | 'vip' | 'embaixador';
    const resolvedTier = isSignupAdmin ? 'ADMIN' : (tier || 'Embaixador Voice');

    const newUser = new User(
      crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      passwordHash,
      resolvedGroup,
      resolvedTier,
      0,
      1,
      isSignupAdmin,
      new Date(),
      true,
      null,
      business || '',
      phone || null,
      newsletter || false,
    );

    const saved = await this.userRepository.create(newUser);
    const token = this.jwtService.sign({ sub: saved.id, email: saved.email });

    return {
      token,
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        group: saved.isAdmin ? 'admin' : saved.groupType,
        tier: saved.tier,
        xp: saved.xp,
        level: saved.level,
        isAdmin: saved.isAdmin,
        isActive: saved.isActive,
        profileImage: saved.profileImage,
        isFirstLogin: true,
      },
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado — inclui isFirstLogin (sem ModuleProgress)' })
  @ApiResponse({ status: 200, description: 'Dados do usuário com isFirstLogin' })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    const user: User = req.user;
    const progressCount = await this.prisma.moduleProgress.count({
      where: { enrollment: { userId: user.id }, isCompleted: true },
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      group: user.isAdmin ? 'admin' : user.groupType,
      tier: user.tier,
      xp: user.xp,
      level: user.level,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      profileImage: user.profileImage,
      business: user.business,
      isFirstLogin: progressCount === 0,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza nome, avatar e profileImage do usuário autenticado (admin pode alterar level)' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req: any, @Body() body: any) {
    const user: User = req.user;
    if (body.name !== undefined) user.name = body.name;
    if (body.profileImage !== undefined) user.profileImage = body.profileImage;
    if (body.level !== undefined && user.isAdmin) user.level = body.level; // admin can update level
    
    const updated = await this.userRepository.update(user);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      group: updated.isAdmin ? 'admin' : updated.groupType,
      tier: updated.tier,
      xp: updated.xp,
      level: updated.level,
      isAdmin: updated.isAdmin,
      isActive: updated.isActive,
      profileImage: updated.profileImage,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lista todos os usuários da plataforma' })
  @ApiResponse({ status: 200, description: 'Array de usuários com grupo, tier, XP e empresa' })
  @ApiResponse({ status: 401, description: 'Apenas administradores' })
  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async listAllUsers(@Req() req: any) {
    const user: User = req.user;
    if (!user.isAdmin) {
      throw new UnauthorizedException('Acesso restrito para administradores');
    }
    const users = await this.userRepository.listAll();
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      group: u.groupType,
      tier: u.tier,
      xp: u.xp,
      level: u.level,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      newsletter: u.newsletter,
      profileImage: u.profileImage,
      business: u.business,
    }));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza dados de qualquer usuário — grupo, tier, XP, level, isActive, empresa' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Put('users/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const admin: User = req.user;
    if (!admin.isAdmin) {
      throw new ForbiddenException('Acesso restrito para administradores');
    }
    const target = await this.userRepository.findById(id);
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (body.name !== undefined) target.name = body.name;
    if (body.group !== undefined) target.groupType = body.group;
    if (body.tier !== undefined) target.tier = body.tier;
    if (body.xp !== undefined) target.xp = body.xp;
    if (body.level !== undefined) target.level = body.level;
    if (body.isActive !== undefined) target.isActive = body.isActive;
    if (body.business !== undefined) target.business = body.business;
    if (body.newsletter !== undefined) target.newsletter = body.newsletter;

    const updated = await this.userRepository.update(target);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      group: updated.groupType,
      tier: updated.tier,
      xp: updated.xp,
      level: updated.level,
      isAdmin: updated.isAdmin,
      isActive: updated.isActive,
      newsletter: updated.newsletter,
      profileImage: updated.profileImage,
      business: updated.business,
    };
  }

  @Patch('users/:id/toggle-active')
  @UseGuards(AuthGuard('jwt'))
  async toggleUserActive(@Req() req: any, @Param('id') id: string) {
    const admin: User = req.user;
    if (!admin.isAdmin) {
      throw new ForbiddenException('Acesso restrito para administradores');
    }
    const target = await this.userRepository.findById(id);
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }
    target.isActive = !target.isActive;
    const updated = await this.userRepository.update(target);
    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Exclui permanentemente um usuário e todos os dados vinculados (certificados, progresso, etc)' })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Delete('users/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    const admin: User = req.user;
    if (!admin.isAdmin) {
      throw new ForbiddenException('Acesso restrito para administradores');
    }
    
    // Prevent admin from deleting themselves
    if (admin.id === id) {
      throw new BadRequestException('Você não pode excluir sua própria conta');
    }

    const target = await this.userRepository.findById(id);
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.userRepository.delete(id);
    return { message: 'Usuário e todos os dados vinculados foram excluídos com sucesso' };
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
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const user: User = req.user;
    
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `avatar_${user.id}_${Date.now()}${ext}`;
    
    const imageUrl = await this.supabaseStorage.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      'avatars'
    );
    
    user.profileImage = imageUrl;
    const updated = await this.userRepository.update(user);
    return {
      profileImage: updated.profileImage,
      message: 'Avatar atualizado com sucesso',
    };
  }

  @ApiOperation({ summary: 'Solicita token de redefinição de senha — retorna mensagem genérica' })
  @ApiResponse({ status: 201, description: 'Mensagem de confirmação' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    const { email } = body;
    if (!email) throw new BadRequestException('E-mail é obrigatório');

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { message: 'Se o e-mail estiver cadastrado, um link de redefinição será disponibilizado.' };
    }

    const token = nodeCrypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    await this.prisma.profile.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpiry: expiry },
    });

    const resetUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/redefinir-senha?token=${token}`;
    this.logger.log(`[PASSWORD RESET] Token para ${email}: ${resetUrl}`);

    return { message: 'Se o e-mail estiver cadastrado, um link de redefinição será disponibilizado.', debug_url: resetUrl };
  }

  @ApiOperation({ summary: 'Redefine senha com token válido' })
  @ApiResponse({ status: 201, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const { token, password } = body;
    if (!token || !password) throw new BadRequestException('Token e nova senha são obrigatórios');
    if (password.length < 6) throw new BadRequestException('A senha deve ter pelo menos 6 caracteres');

    const profile = await this.prisma.profile.findFirst({
      where: { resetPasswordToken: token },
    });

    if (!profile) throw new BadRequestException('Token inválido ou já utilizado');

    if (!profile.resetPasswordExpiry || new Date() > profile.resetPasswordExpiry) {
      throw new BadRequestException('Token expirado. Solicite um novo link de redefinição.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { passwordHash, resetPasswordToken: null, resetPasswordExpiry: null },
    });

    return { message: 'Senha redefinida com sucesso. Você já pode fazer login.' };
  }

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  async getLeaderboard(@Req() req: any, @Query('group') group?: string) {
    const user: User = req.user;
    // Admin can see all groups or filter by group
    if (user.isAdmin) {
      return (await this.userRepository.listLeaderboard(group || undefined)).map(u => ({
        id: u.id,
        name: u.name,
        group: u.groupType,
        tier: u.tier,
        xp: u.xp,
        level: u.level,
        profileImage: u.profileImage,
      }));
    }
    // Regular users see their group
    return (await this.userRepository.listLeaderboard(user.groupType)).map(u => ({
      id: u.id,
      name: u.name,
      group: u.groupType,
      tier: u.tier,
      xp: u.xp,
      level: u.level,
      profileImage: u.profileImage,
    }));
  }
}
