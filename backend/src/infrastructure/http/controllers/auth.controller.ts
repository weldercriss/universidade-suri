import { Controller, Post, Body, Get, Put, Patch, Param, Query, UseGuards, Req, Inject, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
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
        avatar: user.avatarUrl,
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

  @Post('signup')
  async signup(@Body() body: any) {
    const { name, email, password, group, tier } = body;
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isSignupAdmin = group === 'admin' || body.isAdmin === true;
    const resolvedGroup = isSignupAdmin ? 'admin' : (group || 'embaixador');
    const resolvedTier = isSignupAdmin ? 'ADMIN' : (tier || 'Embaixador Voice');

    const newUser = new User(
      crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      passwordHash,
      name.substring(0, 2).toUpperCase(),
      resolvedGroup,
      resolvedTier,
      0,
      1,
      isSignupAdmin,
      new Date(),
      true,
      null,
    );

    const saved = await this.userRepository.create(newUser);
    const token = this.jwtService.sign({ sub: saved.id, email: saved.email });

    return {
      token,
      user: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        avatar: saved.avatarUrl,
        group: saved.isAdmin ? 'admin' : saved.groupType,
        tier: saved.tier,
        xp: saved.xp,
        level: saved.level,
        isAdmin: saved.isAdmin,
        isActive: saved.isActive,
        profileImage: saved.profileImage,
      },
    };
  }

  @Post('google')
  async googleLogin(@Body() body: any) {
    const { token: googleToken, name, email } = body;
    if (!email) {
      throw new UnauthorizedException('Email do Google inválido');
    }

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Create user automatically
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const newUser = new User(
        crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substr(2, 9),
        name || 'Usuário Google',
        email,
        passwordHash,
        (name || 'G').substring(0, 2).toUpperCase(),
        'embaixador',
        'Embaixador Voice',
        0,
        1,
        false,
        new Date(),
        true,
        null,
      );
      user = await this.userRepository.create(newUser);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desabilitada. Entre em contato com o administrador.');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatarUrl,
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

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: any) {
    const user: User = req.user;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl,
      group: user.isAdmin ? 'admin' : user.groupType,
      tier: user.tier,
      xp: user.xp,
      level: user.level,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      profileImage: user.profileImage,
    };
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req: any, @Body() body: any) {
    const user: User = req.user;
    if (body.name !== undefined) user.name = body.name;
    if (body.avatar !== undefined) user.avatarUrl = body.avatar;
    if (body.profileImage !== undefined) user.profileImage = body.profileImage;
    if (body.level !== undefined && user.isAdmin) user.level = body.level; // admin can update level
    
    const updated = await this.userRepository.update(user);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatarUrl,
      group: updated.isAdmin ? 'admin' : updated.groupType,
      tier: updated.tier,
      xp: updated.xp,
      level: updated.level,
      isAdmin: updated.isAdmin,
      isActive: updated.isActive,
      profileImage: updated.profileImage,
    };
  }

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
      avatar: u.avatarUrl,
      group: u.groupType,
      tier: u.tier,
      xp: u.xp,
      level: u.level,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      profileImage: u.profileImage,
    }));
  }

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

    const updated = await this.userRepository.update(target);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatarUrl,
      group: updated.groupType,
      tier: updated.tier,
      xp: updated.xp,
      level: updated.level,
      isAdmin: updated.isAdmin,
      isActive: updated.isActive,
      profileImage: updated.profileImage,
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

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  async getLeaderboard(@Req() req: any, @Query('group') group?: string) {
    const user: User = req.user;
    // Admin can see all groups or filter by group
    if (user.isAdmin) {
      return (await this.userRepository.listLeaderboard(group || undefined)).map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatarUrl,
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
      avatar: u.avatarUrl,
      group: u.groupType,
      tier: u.tier,
      xp: u.xp,
      level: u.level,
      profileImage: u.profileImage,
    }));
  }
}
