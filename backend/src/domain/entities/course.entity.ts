export class Lesson {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public title: string,
    public description: string,
    public content: string,
    public videoUrl: string,
    public duration: string,
    public sortOrder: number,
  ) {}
}

export class Course {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public workloadHours: number,
    public xpReward: number,
    public coverUrl: string,
    public targetGroup: 'all' | 'vip' | 'embaixador',
    public isPublished: boolean,
    public readonly createdAt: Date,
    public lessons: Lesson[] = [],
  ) {}
}
