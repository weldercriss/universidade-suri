import { Injectable } from '@nestjs/common';
import { IPostRepository } from '../../../domain/repositories/post.repository.interface';
import { Post } from '../../../domain/entities/post.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaPostRepository implements IPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(post: Post): Promise<Post> {
    const data = await this.prisma.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        body: post.body,
      },
      include: {
        author: true,
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return new Post(
      data.id,
      data.authorId,
      data.title,
      data.body,
      data.createdAt,
      data.author.name,
      data.author.tier,
      data.author.avatarUrl,
      data.author.groupType,
      data._count.likes,
      data._count.comments
    );
  }

  async listAll(): Promise<Post[]> {
    const data = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        likes: {
          include: { user: true }
        },
        comments: {
          include: { user: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return data.map(d => {
      const post = new Post(
        d.id,
        d.authorId,
        d.title,
        d.body,
        d.createdAt,
        d.author.name,
        d.author.tier,
        d.author.avatarUrl,
        d.author.groupType,
        d._count.likes,
        d._count.comments
      );
      // Attach interaction details for admin view
      (post as any).likedBy = d.likes.map(l => ({ name: l.user.name, email: l.user.email }));
      (post as any).commentDetails = d.comments.map(c => ({
        userName: c.user.name,
        userEmail: c.user.email,
        content: c.content,
        createdAt: c.createdAt,
      }));
      return post;
    });
  }

  async listAllByGroup(groupType: string): Promise<Post[]> {
    const data = await this.prisma.post.findMany({
      where: {
        author: {
          groupType: groupType,
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });

    return data.map(d => new Post(
      d.id,
      d.authorId,
      d.title,
      d.body,
      d.createdAt,
      d.author.name,
      d.author.tier,
      d.author.avatarUrl,
      d.author.groupType,
      d._count.likes,
      d._count.comments
    ));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    // try to create, if unique constraint fails, delete it (toggle like)
    try {
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        // already liked, unlike
        await this.prisma.postLike.delete({
          where: {
            postId_userId: {
              postId,
              userId
            }
          }
        });
      }
    }
  }

  async commentPost(postId: string, userId: string, content: string): Promise<void> {
    await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content
      }
    });
  }
}
