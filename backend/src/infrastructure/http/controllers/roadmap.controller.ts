import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IRoadmapRepository } from '../../../domain/repositories/roadmap.repository.interface';
import { Roadmap, RoadmapItem } from '../../../domain/entities/roadmap.entity';

@Controller('roadmaps')
@UseGuards(AuthGuard('jwt'))
export class RoadmapController {
  constructor(
    @Inject(IRoadmapRepository)
    private readonly roadmapRepository: IRoadmapRepository,
  ) {}

  @Get()
  async list(@Req() req: any) {
    if (req.user.isAdmin) {
      return this.roadmapRepository.listAll();
    }
    return this.roadmapRepository.listAllActive();
  }

  @Get('items/:itemId')
  async getItem(@Param('itemId') itemId: string) {
    const item = await this.roadmapRepository.findItemById(itemId);
    if (!item) throw new NotFoundException('Item não encontrado');
    return item;
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const roadmap = await this.roadmapRepository.findById(id);
    if (!roadmap) throw new NotFoundException('Roadmap não encontrado');
    return roadmap;
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  @Put('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  @Delete('items/:itemId')
  async deleteItem(@Param('itemId') itemId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const deleted = await this.roadmapRepository.deleteItem(itemId);
    if (!deleted) throw new NotFoundException('Item não encontrado');
    return { success: true };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const deleted = await this.roadmapRepository.delete(id);
    if (!deleted) throw new NotFoundException('Roadmap não encontrado');
    return { success: true };
  }

  @Post(':id/items')
  async createItem(@Param('id') roadmapId: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
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
