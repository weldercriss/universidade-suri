import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Controller('trails')
@UseGuards(AuthGuard('jwt'))
export class TrailController {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  /** Lista todas as trilhas com seus cursos e módulos aninhados */
  @Get()
  async listAll(@Req() req: any) {
    const user = req.user;
    const trails = await this.prisma.trail.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        courses: {
          orderBy: { sortOrder: 'asc' },
          include: {
            course: {
              include: { modules: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });

    return trails.map((trail: any) => {
      const trailCourses = trail.courses.map((tc: any) => tc.course);
      const isActive = trailCourses.length > 0;

      // Filtrar por grupo se não for admin
      if (!user.isAdmin) {
        if (trail.targetGroup !== 'all' && trail.targetGroup !== user.groupType) {
          return null;
        }
      }

      return {
        id: trail.id,
        name: trail.name,
        description: trail.description,
        targetGroup: trail.targetGroup,
        sortOrder: trail.sortOrder,
        isActive,
        courses: trail.courses.map((tc: any) => ({
          sortOrder: tc.sortOrder,
          ...tc.course,
        })),
        createdAt: trail.createdAt,
      };
    }).filter(Boolean);
  }

  /** Cria uma nova trilha */
  @Post()
  async create(@Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const trail = await this.prisma.trail.create({
      data: {
        name: body.name,
        description: body.description,
        targetGroup: body.targetGroup || 'all',
        sortOrder: body.sortOrder || 0,
      },
    });
    return trail;
  }

  /** Atualiza uma trilha */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.prisma.trail.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Trilha não encontrada');

    return this.prisma.trail.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        targetGroup: body.targetGroup ?? existing.targetGroup,
        sortOrder: body.sortOrder ?? existing.sortOrder,
      },
    });
  }

  /** Remove uma trilha */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.prisma.trail.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Trilha não encontrada');
    await this.prisma.trail.delete({ where: { id } });
    return { message: 'Trilha removida com sucesso' };
  }

  /** Adiciona um curso a uma trilha */
  @Post(':id/courses')
  async addCourse(@Param('id') trailId: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const trail = await this.prisma.trail.findUnique({ where: { id: trailId } });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    const trailCourse = await this.prisma.trailCourse.upsert({
      where: { trailId_courseId: { trailId, courseId: body.courseId } },
      create: { trailId, courseId: body.courseId, sortOrder: body.sortOrder || 0 },
      update: { sortOrder: body.sortOrder || 0 },
    });

    return trailCourse;
  }

  /** Remove um curso de uma trilha */
  @Delete(':id/courses/:courseId')
  async removeCourse(
    @Param('id') trailId: string,
    @Param('courseId') courseId: string,
    @Req() req: any,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    await this.prisma.trailCourse.deleteMany({
      where: { trailId, courseId },
    });
    return { message: 'Curso removido da trilha' };
  }
}
