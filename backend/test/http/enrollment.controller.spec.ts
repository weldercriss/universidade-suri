import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EnrollmentController } from '../../src/infrastructure/http/controllers/enrollment.controller';
import { buildPrismaMock, buildUserRepoMock, makeAdmin, makeUser } from '../helpers/mocks';

describe('EnrollmentController', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let userRepo: ReturnType<typeof buildUserRepoMock>;
  let controller: EnrollmentController;

  beforeEach(() => {
    prisma = buildPrismaMock();
    userRepo = buildUserRepoMock();
    controller = new EnrollmentController(prisma as any, userRepo as any);
  });

  describe('listMyProgress', () => {
    it('admin recebe lista vazia', async () => {
      const out = await controller.listMyProgress({ user: makeAdmin() });
      expect(out).toEqual([]);
      expect(prisma.enrollment.findMany).not.toHaveBeenCalled();
    });

    it('aluno recebe matrícula com totais corretos', async () => {
      prisma.enrollment.findMany.mockResolvedValue([
        {
          id: 'e1',
          courseId: 'c1',
          progress: [{ moduleId: 'm1' }, { moduleId: 'm2' }],
          course: { modules: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }] },
        },
      ]);
      const out = await controller.listMyProgress({ user: makeUser({ id: 'u1' }) });
      expect(out).toEqual([
        {
          courseId: 'c1',
          enrollmentId: 'e1',
          completedModuleIds: ['m1', 'm2'],
          totalModules: 3,
          completedCount: 2,
        },
      ]);
    });
  });

  describe('getCourseProgress', () => {
    it('rejeita admin', async () => {
      await expect(controller.getCourseProgress('c1', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('sem matrícula retorna estrutura vazia com totalModules', async () => {
      prisma.module.count.mockResolvedValue(4);
      prisma.enrollment.findUnique.mockResolvedValue(null);
      const out = await controller.getCourseProgress('c1', { user: makeUser({ id: 'u1' }) });
      expect(out).toEqual({
        enrollmentId: null,
        completedModuleIds: [],
        totalModules: 4,
        completedCount: 0,
      });
    });

    it('com matrícula retorna progresso atual', async () => {
      prisma.module.count.mockResolvedValue(3);
      prisma.enrollment.findUnique.mockResolvedValue({
        id: 'e1',
        progress: [{ moduleId: 'm1' }],
      });
      const out = await controller.getCourseProgress('c1', { user: makeUser({ id: 'u1' }) });
      expect(out).toEqual({
        enrollmentId: 'e1',
        completedModuleIds: ['m1'],
        totalModules: 3,
        completedCount: 1,
      });
    });
  });

  describe('join', () => {
    it('rejeita admin', async () => {
      await expect(controller.join('c1', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('retorna matrícula existente sem criar nova', async () => {
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      const out = await controller.join('c1', { user: makeUser({ id: 'u1' }) });
      expect(out.enrollmentId).toBe('e1');
      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('cria nova matrícula se inexistente', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 'e2' });
      const out = await controller.join('c1', { user: makeUser({ id: 'u1' }) });
      expect(out.enrollmentId).toBe('e2');
    });
  });

  describe('completeLesson — antifraude sequencial', () => {
    it('rejeita admin', async () => {
      await expect(controller.completeLesson('m1', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound se a aula não existe', async () => {
      prisma.module.findUnique.mockResolvedValue(null);
      await expect(controller.completeLesson('mx', { user: makeUser() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('cria matrícula automaticamente se não existir, completa primeira aula', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.module.findUnique.mockResolvedValue({ id: 'm1', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique.mockResolvedValue(null);
      prisma.module.findMany.mockResolvedValue([
        { id: 'm1', sortOrder: 0 },
        { id: 'm2', sortOrder: 1 },
      ]);
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.course.findUnique.mockResolvedValue({ xpReward: 100 });

      const out = await controller.completeLesson('m1', { user });
      expect(out.message).toBe('Aula concluída!');
      expect(out.courseCompleted).toBe(false);
      expect(prisma.moduleProgress.create).toHaveBeenCalledTimes(1);
    });

    it('bloqueia aula seguinte se anterior não está concluída (anti-fraude)', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.module.findUnique.mockResolvedValue({ id: 'm2', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique
        // verificação de progresso da aula atual: nada
        .mockResolvedValueOnce(null)
        // verificação do anterior: não concluído
        .mockResolvedValueOnce({ isCompleted: false });
      prisma.module.findMany.mockResolvedValue([
        { id: 'm1', sortOrder: 0 },
        { id: 'm2', sortOrder: 1 },
      ]);

      await expect(controller.completeLesson('m2', { user })).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.moduleProgress.create).not.toHaveBeenCalled();
    });

    it('libera segunda aula quando anterior está concluída', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.module.findUnique.mockResolvedValue({ id: 'm2', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique
        .mockResolvedValueOnce(null) // não há progresso da m2
        .mockResolvedValueOnce({ isCompleted: true }); // m1 concluída
      prisma.module.findMany.mockResolvedValue([
        { id: 'm1', sortOrder: 0 },
        { id: 'm2', sortOrder: 1 },
      ]);
      prisma.moduleProgress.count.mockResolvedValue(2);

      const out = await controller.completeLesson('m2', { user });
      expect(out.courseCompleted).toBe(true);
      // XP é concedido ao passar na prova, não ao concluir aulas
      expect(out.message).toMatch(/prova/i);
    });

    it('curso 100% concluído atualiza completedAt e orienta sobre a prova', async () => {
      const user = makeUser({ id: 'u1', xp: 50 });
      prisma.module.findUnique.mockResolvedValue({ id: 'm1', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique.mockResolvedValueOnce(null);
      prisma.module.findMany.mockResolvedValue([{ id: 'm1', sortOrder: 0 }]);
      prisma.moduleProgress.count.mockResolvedValue(1);

      const out = await controller.completeLesson('m1', { user });
      expect(out.courseCompleted).toBe(true);
      expect(prisma.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }));
    });

    it('aula já concluída retorna mensagem informativa', async () => {
      const user = makeUser({ id: 'u1', xp: 10 });
      prisma.module.findUnique.mockResolvedValue({ id: 'm1', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique.mockResolvedValueOnce({ isCompleted: true });

      const out = await controller.completeLesson('m1', { user });
      expect(out.message).toMatch(/já concluída/i);
      expect(prisma.moduleProgress.create).not.toHaveBeenCalled();
    });
  });
});
