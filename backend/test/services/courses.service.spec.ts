import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CoursesService } from '../../src/courses/courses.service';
import { buildCourseRepoMock, buildPrismaMock, buildStorageMock, makeAdmin, makeCourse, makeLesson, makeUser } from '../helpers/mocks';

describe('CoursesService', () => {
  let repo: ReturnType<typeof buildCourseRepoMock>;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let storage: ReturnType<typeof buildStorageMock>;
  let service: CoursesService;

  beforeEach(() => {
    repo = buildCourseRepoMock();
    prisma = buildPrismaMock();
    storage = buildStorageMock();
    prisma.courseInstructor.findMany.mockResolvedValue([]);
    service = new CoursesService(repo as any, storage as any, prisma as any);
  });

  describe('listAll', () => {
    it('admin: vê todos os cursos (incluindo não publicados)', async () => {
      repo.listAll.mockResolvedValue([makeCourse()]);
      const out = await service.listAll(makeAdmin());
      expect(repo.listAll).toHaveBeenCalled();
      expect(repo.listAllPublished).not.toHaveBeenCalled();
      expect(out).toHaveLength(1);
    });

    it('aluno: filtra apenas publicados conforme groupType', async () => {
      repo.listAllPublished.mockResolvedValue([]);
      await service.listAll(makeUser({ groupType: 'vip' as any }));
      expect(repo.listAllPublished).toHaveBeenCalledWith('vip');
    });
  });

  describe('getDetails', () => {
    it('NotFound quando curso não existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getDetails('cx', makeUser()))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('Forbidden quando targetGroup não é "all" e divergente', async () => {
      repo.findById.mockResolvedValue(makeCourse({ targetGroup: 'vip' as any }));
      await expect(service.getDetails('c1', makeUser({ groupType: 'embaixador' as any })))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('targetGroup "all" libera para qualquer grupo', async () => {
      const c = makeCourse({ targetGroup: 'all' as any });
      repo.findById.mockResolvedValue(c);
      const out = await service.getDetails('c1', makeUser({ groupType: 'embaixador' as any }));
      expect(out.id).toBe(c.id);
    });

    it('admin acessa qualquer curso restrito', async () => {
      repo.findById.mockResolvedValue(makeCourse({ targetGroup: 'vip' as any }));
      const out = await service.getDetails('c1', makeAdmin());
      expect(out).toBeDefined();
    });

    it('mesma group_type permite acesso', async () => {
      repo.findById.mockResolvedValue(makeCourse({ targetGroup: 'vip' as any }));
      const out = await service.getDetails('c1', makeUser({ groupType: 'vip' as any }));
      expect(out).toBeDefined();
    });
  });

  describe('create', () => {
    it('rejeita não-admin', async () => {
      await expect(service.create({}, makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin cria curso com defaults aplicados', async () => {
      repo.create.mockImplementation(async (c) => c);
      const out = await service.create(
        { title: 'Novo', description: 'd', coverUrl: 'u' },
        makeAdmin(),
      );
      expect(out.title).toBe('Novo');
      expect(out.workloadHours).toBe(0);
      expect(out.xpReward).toBe(50);
      expect(out.targetGroup).toBe('all');
      expect(out.isPublished).toBe(false);
    });
  });

  describe('update', () => {
    it('rejeita não-admin', async () => {
      await expect(service.update('id', {}, makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound quando curso não existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('id', {}, makeAdmin())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza somente campos fornecidos (?? mantém antigos)', async () => {
      const existing = makeCourse({ title: 'Velho', xpReward: 50, isPublished: false });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockImplementation(async (c) => c);

      const out = await service.update('c1', { title: 'Novo', isPublished: true }, makeAdmin());
      expect(out.title).toBe('Novo');
      expect(out.isPublished).toBe(true);
      expect(out.xpReward).toBe(50);
    });
  });

  describe('delete', () => {
    it('rejeita não-admin', async () => {
      await expect(service.delete('c1', makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin remove curso', async () => {
      repo.delete.mockResolvedValue(true);
      const out = await service.delete('c1', makeAdmin());
      expect(repo.delete).toHaveBeenCalledWith('c1');
      expect(out).toBe(true);
    });
  });

  describe('lessons CRUD', () => {
    it('createLesson rejeita não-admin', async () => {
      await expect(service.createLesson('c1', {}, makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('createLesson com defaults sortOrder=0', async () => {
      repo.createLesson.mockImplementation(async (l) => l);
      const out = await service.createLesson('c1', { title: 'A1', description: 'd', content: 'c', videoUrl: 'v' }, makeAdmin());
      expect(out.courseId).toBe('c1');
      expect(out.sortOrder).toBe(0);
    });

    it('updateLesson NotFound se aula não existe', async () => {
      repo.findLessonById.mockResolvedValue(null);
      await expect(service.updateLesson('lx', {}, makeAdmin())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updateLesson preserva valores ausentes', async () => {
      const lesson = makeLesson({ title: 'Velho', sortOrder: 2 });
      repo.findLessonById.mockResolvedValue(lesson);
      repo.updateLesson.mockImplementation(async (l) => l);
      const out = await service.updateLesson('l1', { title: 'Novo' }, makeAdmin());
      expect(out.title).toBe('Novo');
      expect(out.sortOrder).toBe(2);
    });

    it('deleteLesson admin remove com sucesso', async () => {
      repo.deleteLesson.mockResolvedValue(true);
      const out = await service.deleteLesson('l1', makeAdmin());
      expect(out).toBe(true);
    });

    it('deleteLesson rejeita não-admin', async () => {
      await expect(service.deleteLesson('l1', makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
