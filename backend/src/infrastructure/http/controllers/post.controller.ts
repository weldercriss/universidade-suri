import { Controller, Get, Post as PostMethod, Param, Body, UseGuards, Inject, Req, ForbiddenException, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IPostRepository } from '../../../domain/repositories/post.repository.interface';
import { Post } from '../../../domain/entities/post.entity';
import { User } from '../../../domain/entities/user.entity';
import { PrismaService } from '../../database/prisma.service';

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostController {
  constructor(
    @Inject(IPostRepository)
    private readonly postRepository: IPostRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Get('mine')
  async getMyPosts(@Req() req: any) {
    const user: User = req.user;
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

  @Get()
  async listPosts(@Req() req: any, @Query('courseId') courseId?: string) {
    const user: User = req.user;
    if (courseId) {
      return this.postRepository.listByCourse(courseId);
    }
    if (user.isAdmin) {
      return this.postRepository.listAll();
    }
    return this.postRepository.listAllByGroup(user.groupType);
  }

  @PostMethod()
  async createPost(@Req() req: any, @Body() body: any) {
    const user: User = req.user;
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

  @PostMethod(':id/like')
  async likePost(@Req() req: any, @Param('id') id: string) {
    const user: User = req.user;
    await this.postRepository.likePost(id, user.id);
    return { success: true };
  }

  @PostMethod(':id/comments')
  async commentPost(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const user: User = req.user;
    await this.postRepository.commentPost(id, user.id, body.content);
    return { success: true };
  }
}
