import { Controller, Get, Post as PostMethod, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../domain/entities/user.entity';
import { PostsService } from './posts.service';

@Controller('posts')
@UseGuards(AuthGuard('jwt'))
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('mine')
  async getMyPosts(@Req() req: any) {
    return this.postsService.getMyPosts(req.user as User);
  }

  @Get()
  async listPosts(@Req() req: any, @Query('courseId') courseId?: string) {
    return this.postsService.listPosts(req.user as User, courseId);
  }

  @PostMethod()
  async createPost(@Req() req: any, @Body() body: any) {
    return this.postsService.createPost(req.user as User, body);
  }

  @PostMethod(':id/like')
  async likePost(@Req() req: any, @Param('id') id: string) {
    return this.postsService.likePost(req.user as User, id);
  }

  @PostMethod(':id/comments')
  async commentPost(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.postsService.commentPost(req.user as User, id, body.content);
  }
}
