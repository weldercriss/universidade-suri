import { ForbiddenException } from '@nestjs/common';
import { PostsService } from '../../src/posts/posts.service';
import { buildPostRepoMock, buildPrismaMock, makeAdmin, makePost, makeUser } from '../helpers/mocks';

describe('PostsService', () => {
  let repo: ReturnType<typeof buildPostRepoMock>;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: PostsService;

  beforeEach(() => {
    repo = buildPostRepoMock();
    prisma = buildPrismaMock();
    service = new PostsService(repo as any, prisma as any);
  });

  describe('listPosts', () => {
    it('admin vê todos os posts (todos os grupos)', async () => {
      repo.listAll.mockResolvedValue([makePost()]);
      const out = await service.listPosts(makeAdmin());
      expect(repo.listAll).toHaveBeenCalled();
      expect(repo.listAllByGroup).not.toHaveBeenCalled();
      expect(out).toHaveLength(1);
    });

    it('aluno vê somente posts do seu grupo (segregação)', async () => {
      repo.listAllByGroup.mockResolvedValue([]);
      await service.listPosts(makeUser({ groupType: 'vip' as any }));
      expect(repo.listAllByGroup).toHaveBeenCalledWith('vip');
    });

    it('filtra por curso quando courseId informado', async () => {
      repo.listByCourse.mockResolvedValue([]);
      await service.listPosts(makeUser(), 'c1');
      expect(repo.listByCourse).toHaveBeenCalledWith('c1');
    });
  });

  describe('createPost', () => {
    it('admin não pode publicar projetos', async () => {
      await expect(service.createPost(makeAdmin(), { title: 't', body: 'b' }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('aluno cria post com authorId correto', async () => {
      repo.create.mockImplementation(async (p) => p);
      prisma.xpRule.findUnique.mockResolvedValue(null);
      const out = await service.createPost(makeUser({ id: 'u1' }), { title: 'T', body: 'B' });
      expect(out.authorId).toBe('u1');
      expect(out.title).toBe('T');
      expect(out.body).toBe('B');
      expect(out.id).toBeDefined();
    });
  });

  describe('likePost', () => {
    it('chama o repositório com postId/userId e retorna success', async () => {
      const out = await service.likePost(makeUser({ id: 'u1' }), 'p1');
      expect(repo.likePost).toHaveBeenCalledWith('p1', 'u1');
      expect(out).toEqual({ success: true });
    });
  });

  describe('commentPost', () => {
    it('chama o repositório com conteúdo do comentário', async () => {
      const out = await service.commentPost(makeUser({ id: 'u1' }), 'p1', 'top!');
      expect(repo.commentPost).toHaveBeenCalledWith('p1', 'u1', 'top!');
      expect(out).toEqual({ success: true });
    });
  });
});
