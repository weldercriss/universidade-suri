import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoadmapsService } from './roadmaps.service';

@Controller('roadmaps')
@UseGuards(AuthGuard('jwt'))
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get()
  async list(@Req() req: any) {
    return this.roadmapsService.list(req.user);
  }

  @Get('items/:itemId')
  async getItem(@Param('itemId') itemId: string) {
    return this.roadmapsService.getItem(itemId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.roadmapsService.getOne(id);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.roadmapsService.create(body, req.user);
  }

  @Put('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() body: any, @Req() req: any) {
    return this.roadmapsService.updateItem(itemId, body, req.user);
  }

  @Delete('items/:itemId')
  async deleteItem(@Param('itemId') itemId: string, @Req() req: any) {
    return this.roadmapsService.deleteItem(itemId, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.roadmapsService.update(id, body, req.user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.roadmapsService.delete(id, req.user);
  }

  @Post(':id/items')
  async createItem(@Param('id') roadmapId: string, @Body() body: any, @Req() req: any) {
    return this.roadmapsService.createItem(roadmapId, body, req.user);
  }
}
