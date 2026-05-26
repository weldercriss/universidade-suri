import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { Course, Lesson } from '../../../domain/entities/course.entity';

@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CourseController {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
  ) {}

  @Get()
  async listAll(@Req() req: any) {
    const user = req.user;
    if (user.isAdmin) {
      return this.courseRepository.listAll();
    }
    return this.courseRepository.listAllPublished(user.groupType);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!user.isAdmin && course.targetGroup !== 'all' && course.targetGroup !== user.groupType) {
      throw new ForbiddenException('Acesso restrito ao grupo ' + course.targetGroup.toUpperCase());
    }

    return course;
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const course = new Course(
      '',
      body.title,
      body.description,
      body.workloadHours || 0,
      body.xpReward || 50,
      body.coverUrl,
      body.targetGroup || 'all',
      body.isPublished || false,
      new Date()
    );
    return this.courseRepository.create(course);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Curso não encontrado');
    
    course.title = body.title ?? course.title;
    course.description = body.description ?? course.description;
    course.workloadHours = body.workloadHours ?? course.workloadHours;
    course.xpReward = body.xpReward ?? course.xpReward;
    course.coverUrl = body.coverUrl ?? course.coverUrl;
    course.targetGroup = body.targetGroup ?? course.targetGroup;
    course.isPublished = body.isPublished ?? course.isPublished;

    return this.courseRepository.update(course);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.delete(id);
  }

  // Modules / Lessons Sub-routes
  @Post(':id/lessons')
  async createLesson(@Param('id') courseId: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const lesson = new Lesson(
      '',
      courseId,
      body.title,
      body.description,
      body.content,
      body.videoUrl,
      body.sortOrder || 0
    );
    return this.courseRepository.createLesson(lesson);
  }

  @Put('lessons/:lessonId')
  async updateLesson(@Param('lessonId') lessonId: string, @Body() body: any, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    const lesson = await this.courseRepository.findLessonById(lessonId);
    if (!lesson) throw new NotFoundException('Aula não encontrada');

    lesson.title = body.title ?? lesson.title;
    lesson.description = body.description ?? lesson.description;
    lesson.content = body.content ?? lesson.content;
    lesson.videoUrl = body.videoUrl ?? lesson.videoUrl;
    lesson.sortOrder = body.sortOrder ?? lesson.sortOrder;

    return this.courseRepository.updateLesson(lesson);
  }

  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.deleteLesson(lessonId);
  }
}
