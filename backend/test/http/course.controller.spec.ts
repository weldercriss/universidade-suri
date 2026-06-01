import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CourseController } from '../../src/infrastructure/http/controllers/course.controller';
import { buildCourseRepoMock, makeAdmin, makeCourse, makeLesson, makeUser } from '../helpers/mocks';

describe('CourseController', () => {
  let repo: ReturnType<typeof buildCourseRepoMock>;
  let controller: CourseController;

  beforeEach(() => {
    repo = buildCourseRepoMock();
    controller = new CourseController(repo as any);
  });

  describe('listAll', () => {
    it('admin: vê todos os cursos (incluindo não publicados)', async () => {
      repo.listAll.mockResolvedValue([makeCourse()]);
      const out = await controller.listAll({ user: makeAdmin() });
      expect(repo.listAll).toHaveBeenCalled();
      expect(repo.listAllPublished).not.toHaveBeenCalled();
      expect(out).toHaveLength(1);
    });

    it('aluno: filtra apenas publicados conforme groupType', async () => {
      repo.listAllPublished.mockResolvedValue([]);
      await controller.listAll({ user: makeUser({ groupType: 'vip' as any }) });
      expect(repo.listAllPublished).toHaveBeenCalledWith('vip');
    });
  });

  describe('getDetails', () => {
    it('NotFound quando curso não existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(controller.getDetails('cx', { user: makeUser() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('Forbidden quando targetGroup não é "all" e divergente', async () => {
      repo.findById.mockResolvedValue(makeCourse({ targetGroup: 'vip' as any }));
      await expect(controller.getDetails('c1', { user: makeUser({ groupType: 'embaixador' as any }) }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('targetGroup "all" libera para qualquer grupo', async () => {
      const c = makeCourse({ targetGroup: 'all' as any });
      repo.findById.mockResolvedValue(c);
      const out = await controller.getDetails('c1', { user: makeUser({ groupType: 'embaixador' as any }) });
      expect(out).toBe(c);
    });

    it('admin acessa qualquer curso restrito', async () => {
      repo.findById.mockResolvedValue(makeCourse({ targetGroup: 'vip' as any }));
      const out = await controller.getDetails('c1', { user: makeAdmin() });
      expect(out).toBeDefined();
    });

    it('mesma group_type permite acesso', async () => {
      repo.findById.mockResolvedValue(makeCourse({ targetGroup: 'vip' as any }));
      const out = await controller.getDetails('c1', { user: makeUser({ groupType: 'vip' as any }) });
      expect(out).toBeDefined();
    });
  });

  describe('create', () => {
    it('rejeita não-admin', async () => {
      await expect(controller.create({}, { user: makeUser() })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin cria curso com defaults aplicados', async () => {
      repo.create.mockImplementation(async (c) => c);
      const out = await controller.create(
        { title: 'Novo', description: 'd', coverUrl: 'u' },
        { user: makeAdmin() },
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
      await expect(controller.update('id', {}, { user: makeUser() })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound quando curso não existe', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(controller.update('id', {}, { user: makeAdmin() })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza somente campos fornecidos (?? mantém antigos)', async () => {
      const existing = makeCourse({ title: 'Velho', xpReward: 50, isPublished: false });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockImplementation(async (c) => c);

      const out = await controller.update('c1', { title: 'Novo', isPublished: true }, { user: makeAdmin() });
      expect(out.title).toBe('Novo');
      expect(out.isPublished).toBe(true);
      expect(out.xpReward).toBe(50);
    });
  });

  describe('delete', () => {
    it('rejeita não-admin', async () => {
      await expect(controller.delete('c1', { user: makeUser() })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin remove curso', async () => {
      repo.delete.mockResolvedValue(true);
      const out = await controller.delete('c1', { user: makeAdmin() });
      expect(repo.delete).toHaveBeenCalledWith('c1');
      expect(out).toBe(true);
    });
  });

  describe('lessons CRUD', () => {
    it('createLesson rejeita não-admin', async () => {
      await expect(controller.createLesson('c1', {}, { user: makeUser() })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('createLesson com defaults sortOrder=0', async () => {
      repo.createLesson.mockImplementation(async (l) => l);
      const out = await controller.createLesson('c1', { title: 'A1', description: 'd', content: 'c', videoUrl: 'v' }, { user: makeAdmin() });
      expect(out.courseId).toBe('c1');
      expect(out.sortOrder).toBe(0);
    });

    it('updateLesson NotFound se aula não existe', async () => {
      repo.findLessonById.mockResolvedValue(null);
      await expect(controller.updateLesson('lx', {}, { user: makeAdmin() })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updateLesson preserva valores ausentes', async () => {
      const lesson = makeLesson({ title: 'Velho', sortOrder: 2 });
      repo.findLessonById.mockResolvedValue(lesson);
      repo.updateLesson.mockImplementation(async (l) => l);
      const out = await controller.updateLesson('l1', { title: 'Novo' }, { user: makeAdmin() });
      expect(out.title).toBe('Novo');
      expect(out.sortOrder).toBe(2);
    });

    it('deleteLesson admin remove com sucesso', async () => {
      repo.deleteLesson.mockResolvedValue(true);
      const out = await controller.deleteLesson('l1', { user: makeAdmin() });
      expect(out).toBe(true);
    });

    it('deleteLesson rejeita não-admin', async () => {
      await expect(controller.deleteLesson('l1', { user: makeUser() })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
