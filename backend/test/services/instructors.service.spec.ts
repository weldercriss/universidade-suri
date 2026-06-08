import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InstructorsService } from '../../src/instructors/instructors.service';
import { buildInstructorRepoMock, makeAdmin, makeUser } from '../helpers/mocks';

describe('InstructorsService', () => {
  let repo: ReturnType<typeof buildInstructorRepoMock>;
  let service: InstructorsService;

  beforeEach(() => {
    repo = buildInstructorRepoMock();
    service = new InstructorsService(repo as any);
  });

  describe('listPublic', () => {
    it('retorna instrutores ativos sem exigir admin', async () => {
      repo.listActive.mockResolvedValue([{ id: 'i1', name: 'Ana' }]);
      const out = await service.listPublic();
      expect(repo.listActive).toHaveBeenCalled();
      expect(out).toHaveLength(1);
    });
  });

  describe('listAll', () => {
    it('rejeita não-admin', async () => {
      await expect(service.listAll(makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin recebe todos', async () => {
      repo.listAll.mockResolvedValue([{ id: 'i1' }]);
      const out = await service.listAll(makeAdmin());
      expect(out).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('rejeita não-admin', async () => {
      await expect(service.create({ name: 'A', title: 'T' }, makeUser())).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('exige name e title', async () => {
      await expect(service.create({ name: '  ', title: '' }, makeAdmin())).rejects.toBeInstanceOf(BadRequestException);
    });

    it('admin cria com trim e isActive default true', async () => {
      repo.create.mockImplementation(async (d) => d);
      const out = await service.create({ name: '  Ana  ', title: ' Dev ' }, makeAdmin());
      expect(out.name).toBe('Ana');
      expect(out.title).toBe('Dev');
      expect(out.isActive).toBe(true);
    });
  });

  describe('update', () => {
    it('NotFound se instrutor inexistente', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('i1', {}, makeAdmin())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('preserva campos ausentes', async () => {
      repo.findById.mockResolvedValue({ id: 'i1', name: 'Velho', title: 'T', bio: 'b', photoUrl: null, isActive: true });
      repo.update.mockImplementation(async (_id, d) => ({ id: 'i1', ...d }));
      const out = await service.update('i1', { name: 'Novo' }, makeAdmin());
      expect(out.name).toBe('Novo');
      expect(out.title).toBe('T');
    });
  });

  describe('addToCourse', () => {
    it('exige instructorId', async () => {
      await expect(service.addToCourse('c1', '', makeAdmin())).rejects.toBeInstanceOf(BadRequestException);
    });

    it('NotFound quando curso não existe', async () => {
      repo.courseExists.mockResolvedValue(false);
      await expect(service.addToCourse('c1', 'i1', makeAdmin())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('associa quando curso e instrutor existem', async () => {
      repo.courseExists.mockResolvedValue(true);
      repo.findById.mockResolvedValue({ id: 'i1' });
      repo.addToCourse.mockResolvedValue({ courseId: 'c1', instructorId: 'i1' });
      const out = await service.addToCourse('c1', 'i1', makeAdmin());
      expect(repo.addToCourse).toHaveBeenCalledWith('c1', 'i1');
      expect(out.instructorId).toBe('i1');
    });
  });
});
