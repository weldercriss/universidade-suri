export class RoadmapItem {
  constructor(
    public readonly id: string,
    public readonly roadmapId: string,
    public type: 'video' | 'document' | 'reference',
    public title: string,
    public url: string,
    public description: string | null,
    public sortOrder: number,
    public readonly createdAt: Date,
  ) {}
}

export class Roadmap {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public isActive: boolean,
    public sortOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public items: RoadmapItem[] = [],
  ) {}
}
