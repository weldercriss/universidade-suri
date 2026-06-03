export class Post {
  constructor(
    public id: string,
    public authorId: string,
    public title: string,
    public body: string,
    public createdAt: Date,
    public authorName?: string,
    public authorTier?: string,
    public groupType?: string,
    public likes?: number,
    public comments?: number,
    public mediaType?: string,
    public mediaUrl?: string,
    public courseId?: string,
  ) {}
}
