import { Post } from '../entities/post.entity';

export interface IPostRepository {
  create(post: Post): Promise<Post>;
  listAllByGroup(groupType: string): Promise<Post[]>;
  listAll(): Promise<Post[]>;
  likePost(postId: string, userId: string): Promise<void>;
  commentPost(postId: string, userId: string, content: string): Promise<void>;
}
export const IPostRepository = Symbol('IPostRepository');
