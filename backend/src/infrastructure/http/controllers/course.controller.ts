import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Req, ForbiddenException, NotFoundException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { Course, Lesson } from '../../../domain/entities/course.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('courses')
export class CourseController {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
  ) {}

  /** Rota pública — sem autenticação — usada na Landing page */
  @Get('public')
  async listPublicPreview() {
    const courses = await this.courseRepository.listAllPublished('all');
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverUrl: c.coverUrl,
      lessons: (c.lessons || []).length,
    }));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async listAll(@Req() req: any) {
    const user = req.user;
    if (user.isAdmin) {
      return this.courseRepository.listAll();
    }
    return this.courseRepository.listAllPublished(user.groupType);
  }

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.delete(id);
  }

  // Modules / Lessons Sub-routes
  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.deleteLesson(lessonId);
  }

  // Upload de capa do curso
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('cover', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'covers');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req: any, file, cb) => {
        const courseId = req.params?.id || 'course';
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `cover_${courseId}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Formato não suportado. Use JPG, PNG ou WEBP.'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadCover(@Param('id') id: string, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Curso não encontrado');
    course.coverUrl = `/uploads/covers/${file.filename}`;
    const updated = await this.courseRepository.update(course);
    return { coverUrl: updated.coverUrl, message: 'Capa atualizada com sucesso' };
  }
}
