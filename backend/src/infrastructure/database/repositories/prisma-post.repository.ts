import { Injectable } from '@nestjs/common';
import { IPostRepository } from '../../../domain/repositories/post.repository.interface';
import { Post } from '../../../domain/entities/post.entity';
import { PrismaService } from '../prisma.service';

const postInclude = {
  author: true,
  likes: {
    include: { user: true },
  },
  comments: {
    include: { user: true },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: { likes: true, comments: true },
  },
};

@Injectable()
export class PrismaPostRepository implements IPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(d: {
    id: string;
    authorId: string;
    title: string;
    body: string;
    createdAt: Date;
    mediaType?: string | null;
    mediaUrl?: string | null;
    author: { name: string; tier: string; avatarUrl: string | null; groupType: string };
    likes: { user: { name: string; email: string } }[];
    comments: { content: string; createdAt: Date; user: { name: string; email: string } }[];
    _count: { likes: number; comments: number };
  }): Post {
    const post = new Post(
      d.id,
      d.authorId,
      d.title,
      d.body,
      d.createdAt,
      d.author.name,
      d.author.tier,
      d.author.avatarUrl ?? undefined,
      d.author.groupType,
      d._count.likes,
      d._count.comments,
      d.mediaType ?? undefined,
      d.mediaUrl ?? undefined,
    );

    (post as any).likedBy = d.likes.map((l) => ({ name: l.user.name, email: l.user.email }));
    (post as any).commentDetails = d.comments.map((c) => ({
      userName: c.user.name,
      userEmail: c.user.email,
      content: c.content,
      createdAt: c.createdAt,
    }));
    if (d.mediaType && d.mediaUrl) {
      (post as any).media = { type: d.mediaType, url: d.mediaUrl };
    }

    return post;
  }

  async create(post: Post): Promise<Post> {
    const data = await this.prisma.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        body: post.body,
        mediaType: post.mediaType,
        mediaUrl: post.mediaUrl,
      },
      include: postInclude,
    });

    return this.mapRow(data);
  }

  async listAll(): Promise<Post[]> {
    const data = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: postInclude,
    });

    return data.map((d) => this.mapRow(d));
  }

  async listAllByGroup(groupType: string): Promise<Post[]> {
    const data = await this.prisma.post.findMany({
      where: {
        author: {
          groupType: groupType,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: postInclude,
    });

    return data.map((d) => this.mapRow(d));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    try {
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        await this.prisma.postLike.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        });
      }
    }
  }

  async commentPost(postId: string, userId: string, content: string): Promise<void> {
    await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content,
      },
    });
  }
}
