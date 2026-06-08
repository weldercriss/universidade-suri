import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IRoadmapRepository } from '../domain/repositories/roadmap.repository.interface';
import { Roadmap, RoadmapItem } from '../domain/entities/roadmap.entity';

@Injectable()
export class RoadmapsService {
  constructor(
    @Inject(IRoadmapRepository)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  async list(user: any) {
    if (user.isAdmin) {
      return this.roadmapRepository.listAll();
    }
    return this.roadmapRepository.listAllActive();
  }

  async getItem(itemId: string) {
    const item = await this.roadmapRepository.findItemById(itemId);
    if (!item) throw new NotFoundException('Item não encontrado');
    return item;
  }

  async getOne(id: string) {
    const roadmap = await this.roadmapRepository.findById(id);
    if (!roadmap) throw new NotFoundException('Roadmap não encontrado');
    return roadmap;
  }

  async create(body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const roadmap = new Roadmap(
      '',
      body.title,
      body.description || null,
      body.isActive !== undefined ? body.isActive : true,
      body.sortOrder || 0,
      new Date(),
      new Date(),
    );
    return this.roadmapRepository.create(roadmap);
  }

  async updateItem(itemId: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.roadmapRepository.findItemById(itemId);
    if (!existing) throw new NotFoundException('Item não encontrado');
    const item = new RoadmapItem(
      itemId,
      existing.roadmapId,
      body.type || existing.type,
      body.title || existing.title,
      body.url || existing.url,
      body.description !== undefined ? body.description : existing.description,
      body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
      existing.createdAt,
    );
    return this.roadmapRepository.updateItem(item);
  }

  async deleteItem(itemId: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const deleted = await this.roadmapRepository.deleteItem(itemId);
    if (!deleted) throw new NotFoundException('Item não encontrado');
    return { success: true };
  }

  async update(id: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.roadmapRepository.findById(id);
    if (!existing) throw new NotFoundException('Roadmap não encontrado');
    const roadmap = new Roadmap(
      id,
      body.title !== undefined ? body.title : existing.title,
      body.description !== undefined ? body.description : existing.description,
      body.isActive !== undefined ? body.isActive : existing.isActive,
      body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
      existing.createdAt,
      new Date(),
    );
    return this.roadmapRepository.update(roadmap);
  }

  async delete(id: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const deleted = await this.roadmapRepository.delete(id);
    if (!deleted) throw new NotFoundException('Roadmap não encontrado');
    return { success: true };
  }

  async createItem(roadmapId: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const roadmap = await this.roadmapRepository.findById(roadmapId);
    if (!roadmap) throw new NotFoundException('Roadmap não encontrado');
    const item = new RoadmapItem(
      '',
      roadmapId,
      body.type,
      body.title,
      body.url,
      body.description || null,
      body.sortOrder || 0,
      new Date(),
    );
    return this.roadmapRepository.createItem(item);
  }
}
