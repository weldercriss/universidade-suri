import { Injectable, Inject, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as nodeCrypto from 'crypto';
import { IUserRepository } from '../domain/repositories/user.repository.interface';
import { User } from '../domain/entities/user.entity';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { LoginDto, SignupDto } from '../infrastructure/http/dtos/auth.dto';
import { SupabaseStorageService } from '../infrastructure/storage/supabase-storage.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  async login(body: LoginDto) {
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

  async signup(body: SignupDto) {
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

  async getProfile(user: User) {
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

  async updateProfile(user: User, body: any) {
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

  async listAllUsers(user: User) {
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

  async updateUser(admin: User, id: string, body: any) {
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

  async toggleUserActive(admin: User, id: string) {
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

  async deleteUser(admin: User, id: string) {
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

  async uploadAvatar(user: User, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');

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

  async forgotPassword(body: any) {
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

  async resetPassword(body: any) {
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

  async getLeaderboard(user: User, group?: string) {
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
