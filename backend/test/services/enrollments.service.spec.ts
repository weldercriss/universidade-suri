import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from '../../src/enrollments/enrollments.service';
import { buildPrismaMock, makeAdmin, makeUser } from '../helpers/mocks';

describe('EnrollmentsService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: EnrollmentsService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new EnrollmentsService(prisma as any);
  });

  describe('listMyProgress', () => {
    it('admin recebe lista vazia', async () => {
      const out = await service.listMyProgress(makeAdmin());
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
      const out = await service.listMyProgress(makeUser({ id: 'u1' }));
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
      await expect(service.getCourseProgress('c1', makeAdmin()))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('sem matrícula retorna estrutura vazia com totalModules', async () => {
      prisma.module.count.mockResolvedValue(4);
      prisma.enrollment.findUnique.mockResolvedValue(null);
      const out = await service.getCourseProgress('c1', makeUser({ id: 'u1' }));
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
      const out = await service.getCourseProgress('c1', makeUser({ id: 'u1' }));
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
      await expect(service.join('c1', makeAdmin()))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('retorna matrícula existente sem criar nova', async () => {
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      const out = await service.join('c1', makeUser({ id: 'u1' }));
      expect(out.enrollmentId).toBe('e1');
      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('cria nova matrícula se inexistente', async () => {
      prisma.enrollment.findUnique.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 'e2' });
      const out = await service.join('c1', makeUser({ id: 'u1' }));
      expect(out.enrollmentId).toBe('e2');
    });
  });

  describe('completeLesson — antifraude sequencial', () => {
    it('rejeita admin', async () => {
      await expect(service.completeLesson('m1', makeAdmin()))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound se a aula não existe', async () => {
      prisma.module.findUnique.mockResolvedValue(null);
      await expect(service.completeLesson('mx', makeUser()))
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

      const out = await service.completeLesson('m1', user);
      expect(out.message).toBe('Aula concluída!');
      expect(out.courseCompleted).toBe(false);
      expect(prisma.moduleProgress.create).toHaveBeenCalledTimes(1);
    });

    it('bloqueia aula seguinte se anterior não está concluída (anti-fraude)', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.module.findUnique.mockResolvedValue({ id: 'm2', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ isCompleted: false });
      prisma.module.findMany.mockResolvedValue([
        { id: 'm1', sortOrder: 0 },
        { id: 'm2', sortOrder: 1 },
      ]);

      await expect(service.completeLesson('m2', user)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.moduleProgress.create).not.toHaveBeenCalled();
    });

    it('libera segunda aula quando anterior está concluída', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.module.findUnique.mockResolvedValue({ id: 'm2', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ isCompleted: true });
      prisma.module.findMany.mockResolvedValue([
        { id: 'm1', sortOrder: 0 },
        { id: 'm2', sortOrder: 1 },
      ]);
      prisma.moduleProgress.count.mockResolvedValue(2);

      const out = await service.completeLesson('m2', user);
      expect(out.courseCompleted).toBe(true);
      expect(out.message).toMatch(/prova/i);
    });

    it('curso 100% concluído atualiza completedAt e orienta sobre a prova', async () => {
      const user = makeUser({ id: 'u1', xp: 50 });
      prisma.module.findUnique.mockResolvedValue({ id: 'm1', courseId: 'c1' });
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.findUnique.mockResolvedValueOnce(null);
      prisma.module.findMany.mockResolvedValue([{ id: 'm1', sortOrder: 0 }]);
      prisma.moduleProgress.count.mockResolvedValue(1);

      const out = await service.completeLesson('m1', user);
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

      const out = await service.completeLesson('m1', user);
      expect(out.message).toMatch(/já concluída/i);
      expect(prisma.moduleProgress.create).not.toHaveBeenCalled();
    });
  });
});
