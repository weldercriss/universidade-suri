import { ForbiddenException } from '@nestjs/common';
import { PostController } from '../../src/infrastructure/http/controllers/post.controller';
import { buildPostRepoMock, buildPrismaMock, makeAdmin, makePost, makeUser } from '../helpers/mocks';

describe('PostController', () => {
  let repo: ReturnType<typeof buildPostRepoMock>;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let controller: PostController;

  beforeEach(() => {
    repo = buildPostRepoMock();
    prisma = buildPrismaMock();
    controller = new PostController(repo as any, prisma as any);
  });

  describe('listPosts', () => {
    it('admin vê todos os posts (todos os grupos)', async () => {
      repo.listAll.mockResolvedValue([makePost()]);
      const out = await controller.listPosts({ user: makeAdmin() });
      expect(repo.listAll).toHaveBeenCalled();
      expect(repo.listAllByGroup).not.toHaveBeenCalled();
      expect(out).toHaveLength(1);
    });

    it('aluno vê somente posts do seu grupo (segregação)', async () => {
      repo.listAllByGroup.mockResolvedValue([]);
      await controller.listPosts({ user: makeUser({ groupType: 'vip' as any }) });
      expect(repo.listAllByGroup).toHaveBeenCalledWith('vip');
    });
  });

  describe('createPost', () => {
    it('admin não pode publicar projetos', async () => {
      await expect(controller.createPost({ user: makeAdmin() }, { title: 't', body: 'b' }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('aluno cria post com authorId correto', async () => {
      repo.create.mockImplementation(async (p) => p);
      const out = await controller.createPost({ user: makeUser({ id: 'u1' }) }, { title: 'T', body: 'B' });
      expect(out.authorId).toBe('u1');
      expect(out.title).toBe('T');
      expect(out.body).toBe('B');
      expect(out.id).toBeDefined();
    });
  });

  describe('likePost', () => {
    it('chama o repositório com postId/userId e retorna success', async () => {
      const out = await controller.likePost({ user: makeUser({ id: 'u1' }) }, 'p1');
      expect(repo.likePost).toHaveBeenCalledWith('p1', 'u1');
      expect(out).toEqual({ success: true });
    });
  });

  describe('commentPost', () => {
    it('chama o repositório com conteúdo do comentário', async () => {
      const out = await controller.commentPost({ user: makeUser({ id: 'u1' }) }, 'p1', { content: 'top!' });
      expect(repo.commentPost).toHaveBeenCalledWith('p1', 'u1', 'top!');
      expect(out).toEqual({ success: true });
    });
  });
});
