import { Controller, Get, Post as PostMethod, Param, Body, UseGuards, Inject, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IPostRepository } from '../../../domain/repositories/post.repository.interface';
import { Post } from '../../../domain/entities/post.entity';
import { User } from '../../../domain/entities/user.entity';

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostController {
  constructor(
    @Inject(IPostRepository)
    private readonly postRepository: IPostRepository,
  ) {}

  @Get()
  async listPosts(@Req() req: any) {
    const user: User = req.user;
    // Admin sees ALL posts across all groups with interaction details
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
    );
    return this.postRepository.create(post);
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
