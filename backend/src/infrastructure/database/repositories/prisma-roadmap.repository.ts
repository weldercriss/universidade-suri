import { Injectable, Logger } from '@nestjs/common';
import { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { Roadmap, RoadmapItem } from '../../../domain/entities/roadmap.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaRoadmapRepository implements IRoadmapRepository {
  private readonly logger = new Logger(PrismaRoadmapRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<Roadmap[]> {
    try {
      const rows = await this.prisma.roadmap.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      return rows.map(r => this.mapRoadmapRow(r, r.items));
    } catch (e) {
      this.logger.error('Error listing all roadmaps', e);
      return [];
    }
  }

  async listAllActive(): Promise<Roadmap[]> {
    try {
      const rows = await this.prisma.roadmap.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      return rows.map(r => this.mapRoadmapRow(r, r.items));
    } catch (e) {
      this.logger.error('Error listing active roadmaps', e);
      return [];
    }
  }

  async findById(id: string): Promise<Roadmap | null> {
    try {
      const row = await this.prisma.roadmap.findUnique({
        where: { id },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      if (!row) return null;
      return this.mapRoadmapRow(row, row.items);
    } catch (e) {
      this.logger.error('Error finding roadmap by id', e);
      return null;
    }
  }

  async create(roadmap: Roadmap): Promise<Roadmap> {
    try {
      const row = await this.prisma.roadmap.create({
        data: {
          title: roadmap.title,
          description: roadmap.description,
          isActive: roadmap.isActive,
          sortOrder: roadmap.sortOrder,
        },
      });
      return this.mapRoadmapRow(row, []);
    } catch (e) {
      this.logger.error('Error creating roadmap', e);
      throw e;
    }
  }

  async update(roadmap: Roadmap): Promise<Roadmap> {
    try {
      await this.prisma.roadmap.update({
        where: { id: roadmap.id },
        data: {
          title: roadmap.title,
          description: roadmap.description,
          isActive: roadmap.isActive,
          sortOrder: roadmap.sortOrder,
        },
      });
      return this.findById(roadmap.id) as Promise<Roadmap>;
    } catch (e) {
      this.logger.error('Error updating roadmap', e);
      throw e;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.roadmap.delete({ where: { id } });
      return true;
    } catch (e) {
      this.logger.error('Error deleting roadmap', e);
      return false;
    }
  }

  async createItem(item: RoadmapItem): Promise<RoadmapItem> {
    try {
      const row = await this.prisma.roadmapItem.create({
        data: {
          roadmapId: item.roadmapId,
          type: item.type,
          title: item.title,
          url: item.url,
          description: item.description,
          sortOrder: item.sortOrder,
        },
      });
      return this.mapItemRow(row);
    } catch (e) {
      this.logger.error('Error creating roadmap item', e);
      throw e;
    }
  }

  async updateItem(item: RoadmapItem): Promise<RoadmapItem> {
    try {
      const row = await this.prisma.roadmapItem.update({
        where: { id: item.id },
        data: {
          type: item.type,
          title: item.title,
          url: item.url,
          description: item.description,
          sortOrder: item.sortOrder,
        },
      });
      return this.mapItemRow(row);
    } catch (e) {
      this.logger.error('Error updating roadmap item', e);
      throw e;
    }
  }

  async deleteItem(id: string): Promise<boolean> {
    try {
      await this.prisma.roadmapItem.delete({ where: { id } });
      return true;
    } catch (e) {
      this.logger.error('Error deleting roadmap item', e);
      return false;
    }
  }

  async findItemById(id: string): Promise<RoadmapItem | null> {
    try {
      const row = await this.prisma.roadmapItem.findUnique({ where: { id } });
      if (!row) return null;
      return this.mapItemRow(row);
    } catch (e) {
      this.logger.error('Error finding roadmap item', e);
      return null;
    }
  }

  private mapRoadmapRow(row: any, items: any[] = []): Roadmap {
    const roadmap = new Roadmap(
      row.id,
      row.title,
      row.description,
      row.isActive,
      row.sortOrder,
      new Date(row.createdAt),
      new Date(row.updatedAt),
    );
    roadmap.items = items.map(i => this.mapItemRow(i));
    return roadmap;
  }

  private mapItemRow(row: any): RoadmapItem {
    return new RoadmapItem(
      row.id,
      row.roadmapId,
      row.type as 'video' | 'document' | 'reference',
      row.title,
      row.url,
      row.description,
      row.sortOrder,
      new Date(row.createdAt),
    );
  }
}
