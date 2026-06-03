import { Roadmap, RoadmapItem } from '../entities/roadmap.entity';

export interface IRoadmapRepository {
  listAll(): Promise<Roadmap[]>;
  listAllActive(): Promise<Roadmap[]>;
  findById(id: string): Promise<Roadmap | null>;
  create(roadmap: Roadmap): Promise<Roadmap>;
  update(roadmap: Roadmap): Promise<Roadmap>;
  delete(id: string): Promise<boolean>;

  createItem(item: RoadmapItem): Promise<RoadmapItem>;
  updateItem(item: RoadmapItem): Promise<RoadmapItem>;
  deleteItem(id: string): Promise<boolean>;
  findItemById(id: string): Promise<RoadmapItem | null>;
}

export const IRoadmapRepository = Symbol('IRoadmapRepository');
