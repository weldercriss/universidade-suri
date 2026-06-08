import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { IPostRepository } from '../domain/repositories/post.repository.interface';
import { PrismaPostRepository } from '../infrastructure/database/repositories/prisma-post.repository';

@Module({
  controllers: [PostsController],
  providers: [
    PostsService,
    {
      provide: IPostRepository,
      useClass: PrismaPostRepository,
    },
  ],
  exports: [PostsService],
})
export class PostsModule {}
