import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IPostRepository } from '../domain/repositories/post.repository.interface';
import { Post } from '../domain/entities/post.entity';
import { User } from '../domain/entities/user.entity';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class PostsService {
  constructor(
    @Inject(IPostRepository)
    private readonly postRepository: IPostRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getMyPosts(user: User) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { title: true } } },
    });
    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      courseId: p.courseId,
      courseTitle: (p as any).course?.title ?? null,
      createdAt: p.createdAt,
    }));
  }

  async listPosts(user: User, courseId?: string) {
    if (courseId) {
      return this.postRepository.listByCourse(courseId);
    }
    if (user.isAdmin) {
      return this.postRepository.listAll();
    }
    return this.postRepository.listAllByGroup(user.groupType);
  }

  async createPost(user: User, body: any) {
    if (user.isAdmin) {
      throw new ForbiddenException('Administradores não podem postar projetos');
    }
    const post = new Post(
      crypto.randomUUID ? crypto.randomUUID() : 'post_' + Math.random().toString(36).substr(2, 9),
      user.id,
      body.title,
      body.body,
      new Date(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      body.media?.type,
      body.media?.url,
      body.courseId,
    );
    const created = await this.postRepository.create(post);
    const xpRule = await this.prisma.xpRule.findUnique({ where: { action: 'post' } });
    const xpAmount = (xpRule?.isActive && xpRule.xpValue > 0) ? xpRule.xpValue : 10;
    await this.prisma.profile.update({
      where: { id: user.id },
      data: { xp: { increment: xpAmount } },
    });
    return created;
  }

  async likePost(user: User, id: string) {
    await this.postRepository.likePost(id, user.id);
    return { success: true };
  }

  async commentPost(user: User, id: string, content: string) {
    await this.postRepository.commentPost(id, user.id, content);
    return { success: true };
  }
}
