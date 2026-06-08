import { UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { buildJwtServiceMock, buildPrismaMock, buildStorageMock, buildUserRepoMock, makeAdmin, makeUser } from '../helpers/mocks';

describe('AuthService', () => {
  let userRepo: ReturnType<typeof buildUserRepoMock>;
  let jwt: ReturnType<typeof buildJwtServiceMock>;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let storage: ReturnType<typeof buildStorageMock>;
  let service: AuthService;

  beforeEach(() => {
    userRepo = buildUserRepoMock();
    jwt = buildJwtServiceMock();
    prisma = buildPrismaMock();
    storage = buildStorageMock();
    prisma.moduleProgress.count = jest.fn().mockResolvedValue(0);
    service = new AuthService(userRepo as any, jwt as any, prisma as any, storage as any);
  });

  describe('login', () => {
    it('falha quando email não existe', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x@y.com', password: '1' }))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('falha quando conta está desativada', async () => {
      const user = makeUser({ isActive: false });
      userRepo.findByEmail.mockResolvedValue(user);
      await expect(service.login({ email: user.email, password: 'x' }))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('falha com senha incorreta', async () => {
      const hash = await bcrypt.hash('correta', 10);
      const user = makeUser({ passwordHash: hash });
      userRepo.findByEmail.mockResolvedValue(user);
      await expect(service.login({ email: user.email, password: 'errada' }))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('autentica com sucesso e retorna token + user (admin com group=admin)', async () => {
      const password = 'SuriAdmin123';
      const hash = await bcrypt.hash(password, 10);
      const admin = makeAdmin({ passwordHash: hash });
      userRepo.findByEmail.mockResolvedValue(admin);

      const out = await service.login({ email: admin.email, password });
      expect(out.token).toBe('signed.jwt.token');
      expect(out.user.isAdmin).toBe(true);
      expect(out.user.group).toBe('admin');
      expect(jwt.sign).toHaveBeenCalledWith({ sub: admin.id, email: admin.email });
    });

    it('login de embaixador retorna group=embaixador', async () => {
      const password = '123';
      const hash = await bcrypt.hash(password, 10);
      const user = makeUser({ passwordHash: hash });
      userRepo.findByEmail.mockResolvedValue(user);
      const out = await service.login({ email: user.email, password });
      expect(out.user.group).toBe('embaixador');
    });
  });

  describe('signup', () => {
    it('rejeita email já cadastrado', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());
      await expect(service.signup({ name: 'A', email: 'a@a', password: '1' } as any))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('cria embaixador por padrão e retorna token', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockImplementation(async (u) => u);

      const out = await service.signup({ name: 'João Suri', email: 'joao@suri.com', password: 'pwd123' } as any);
      expect(out.token).toBe('signed.jwt.token');
      expect(out.user.group).toBe('embaixador');
      expect(out.user.tier).toBe('Embaixador Voice');
      expect(out.user.isAdmin).toBe(false);

      const saved = userRepo.create.mock.calls[0][0];
      expect(saved.passwordHash).not.toBe('pwd123');
      expect(saved.passwordHash.startsWith('$2')).toBe(true);
    });

    it('cria admin se group=admin', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockImplementation(async (u) => u);
      const out = await service.signup({ name: 'Adm', email: 'adm@suri.com', password: 'p', group: 'admin' } as any);
      expect(out.user.isAdmin).toBe(true);
      expect(out.user.group).toBe('admin');
      expect(out.user.tier).toBe('ADMIN');
    });

    it('respeita tier informado quando não é admin', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      userRepo.create.mockImplementation(async (u) => u);
      const out = await service.signup({ name: 'Vip Lord', email: 'v@s.com', password: 'p', group: 'vip', tier: 'VIP CORE' } as any);
      expect(out.user.group).toBe('vip');
      expect(out.user.tier).toBe('VIP CORE');
    });
  });

  describe('getProfile', () => {
    it('retorna o perfil do usuário autenticado com isFirstLogin', async () => {
      const user = makeUser({ name: 'Foo', xp: 200, level: 1 });
      prisma.moduleProgress.count.mockResolvedValue(0);
      const result = await service.getProfile(user);
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('Foo');
      expect(result.xp).toBe(200);
      expect(result.isFirstLogin).toBe(true);
    });

    it('isFirstLogin=false quando usuário já tem progresso', async () => {
      const user = makeUser({ name: 'Foo' });
      prisma.moduleProgress.count.mockResolvedValue(3);
      const result = await service.getProfile(user);
      expect(result.isFirstLogin).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('atualiza nome/avatar/profileImage do próprio usuário (não-admin não muda level)', async () => {
      const user = makeUser({ level: 1 });
      userRepo.update.mockImplementation(async (u) => u);
      const out = await service.updateProfile(user, { name: 'Novo', profileImage: 'http://img', level: 99 });
      expect(out.name).toBe('Novo');
      expect(out.profileImage).toBe('http://img');
      expect(out.level).toBe(1);
    });

    it('admin pode alterar próprio level via updateProfile', async () => {
      const admin = makeAdmin({ level: 1 });
      userRepo.update.mockImplementation(async (u) => u);
      const out = await service.updateProfile(admin, { level: 7 });
      expect(out.level).toBe(7);
    });
  });

  describe('listAllUsers', () => {
    it('bloqueia não-admin com Unauthorized', async () => {
      await expect(service.listAllUsers(makeUser())).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('admin recebe listagem mapeada', async () => {
      userRepo.listAll.mockResolvedValue([makeUser({ id: 'u1' }), makeUser({ id: 'u2' })]);
      const out = await service.listAllUsers(makeAdmin());
      expect(out).toHaveLength(2);
      expect(out[0].id).toBe('u1');
    });
  });

  describe('updateUser (admin)', () => {
    it('rejeita não-admin com Forbidden', async () => {
      await expect(service.updateUser(makeUser(), 'u', { name: 'x' }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('retorna NotFound para usuário inexistente', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.updateUser(makeAdmin(), 'u', { name: 'x' }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('admin atualiza tier/group/xp/level/isActive do alvo', async () => {
      const target = makeUser({ id: 't1' });
      userRepo.findById.mockResolvedValue(target);
      userRepo.update.mockImplementation(async (u) => u);

      const out = await service.updateUser(
        makeAdmin(), 't1',
        { name: 'Novo', group: 'vip', tier: 'VIP CORE', xp: 555, level: 3, isActive: false },
      );
      expect(out.name).toBe('Novo');
      expect(out.group).toBe('vip');
      expect(out.tier).toBe('VIP CORE');
      expect(out.xp).toBe(555);
      expect(out.level).toBe(3);
      expect(out.isActive).toBe(false);
    });
  });

  describe('toggleUserActive', () => {
    it('rejeita não-admin', async () => {
      await expect(service.toggleUserActive(makeUser(), 't1'))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('retorna NotFound se alvo inexiste', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.toggleUserActive(makeAdmin(), 't1'))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('inverte isActive do alvo', async () => {
      const target = makeUser({ isActive: true });
      userRepo.findById.mockResolvedValue(target);
      userRepo.update.mockImplementation(async (u) => u);
      const out = await service.toggleUserActive(makeAdmin(), target.id);
      expect(out.isActive).toBe(false);
    });
  });

  describe('getLeaderboard', () => {
    it('admin pode filtrar por grupo', async () => {
      userRepo.listLeaderboard.mockResolvedValue([makeUser()]);
      const out = await service.getLeaderboard(makeAdmin(), 'vip');
      expect(userRepo.listLeaderboard).toHaveBeenCalledWith('vip');
      expect(out).toHaveLength(1);
    });

    it('admin sem filtro lista todos', async () => {
      userRepo.listLeaderboard.mockResolvedValue([]);
      await service.getLeaderboard(makeAdmin(), undefined);
      expect(userRepo.listLeaderboard).toHaveBeenCalledWith(undefined);
    });

    it('usuário comum sempre lista apenas seu grupo', async () => {
      userRepo.listLeaderboard.mockResolvedValue([]);
      const user = makeUser({ groupType: 'embaixador' as any });
      await service.getLeaderboard(user, 'vip');
      expect(userRepo.listLeaderboard).toHaveBeenCalledWith('embaixador');
    });
  });
});
