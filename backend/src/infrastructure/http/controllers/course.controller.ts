import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Req, ForbiddenException, NotFoundException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { Course, Lesson } from '../../../domain/entities/course.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { SupabaseStorageService } from '../../storage/supabase-storage.service';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

  @ApiOperation({ summary: 'Preview público de cursos (sem autenticação, usado na landing page)' })
  @ApiResponse({ status: 200, description: 'Lista resumida de cursos publicados' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista cursos — admin vê todos, aluno vê apenas publicados do seu grupo' })
  @ApiResponse({ status: 200, description: 'Array de cursos' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async listAll(@Req() req: any) {
    const user = req.user;
    if (user.isAdmin) {
      return this.courseRepository.listAll();
    }
    return this.courseRepository.listAllPublished(user.groupType);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes de um curso com suas aulas' })
  @ApiResponse({ status: 200, description: 'Curso encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso restrito ao grupo do curso' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Cria um novo curso' })
  @ApiResponse({ status: 201, description: 'Curso criado' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza dados de um curso' })
  @ApiResponse({ status: 200, description: 'Curso atualizado' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remove um curso' })
  @ApiResponse({ status: 200, description: 'Curso removido' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.delete(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Adiciona uma aula ao curso' })
  @ApiResponse({ status: 201, description: 'Aula criada' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
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
      body.duration || '10:00',
      body.sortOrder || 0
    );
    return this.courseRepository.createLesson(lesson);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza uma aula' })
  @ApiResponse({ status: 200, description: 'Aula atualizada' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
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
    lesson.duration = body.duration ?? lesson.duration;
    lesson.sortOrder = body.sortOrder ?? lesson.sortOrder;

    return this.courseRepository.updateLesson(lesson);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remove uma aula' })
  @ApiResponse({ status: 200, description: 'Aula removida' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.deleteLesson(lessonId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Upload de imagem de capa do curso (JPG/PNG/WEBP, máx 5MB)' })
  @ApiResponse({ status: 201, description: 'Capa atualizada, retorna coverUrl' })
  // Upload de capa do curso
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('cover', {
    storage: memoryStorage(),
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
    
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `cover_${id}_${Date.now()}${ext}`;
    
    const imageUrl = await this.supabaseStorage.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
      'covers'
    );
    
    course.coverUrl = imageUrl;
    const updated = await this.courseRepository.update(course);
    return { coverUrl: updated.coverUrl, message: 'Capa atualizada com sucesso' };
  }
}
