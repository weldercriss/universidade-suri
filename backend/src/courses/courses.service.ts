import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICourseRepository } from '../domain/repositories/course.repository.interface';
import { Course, Lesson } from '../domain/entities/course.entity';
import { SupabaseStorageService } from '../infrastructure/storage/supabase-storage.service';
import { PrismaService } from '../infrastructure/database/prisma.service';
import * as path from 'path';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly prisma: PrismaService,
  ) {}

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

  async listAll(user: any) {
    const courses = user.isAdmin
      ? await this.courseRepository.listAll()
      : await this.courseRepository.listAllPublished(user.groupType);
    return this.attachInstructors(courses);
  }

  async getDetails(id: string, user: any) {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    if (!user.isAdmin && course.targetGroup !== 'all' && course.targetGroup !== user.groupType) {
      throw new ForbiddenException('Acesso restrito ao grupo ' + course.targetGroup.toUpperCase());
    }

    const [withInstructors] = await this.attachInstructors([course]);
    return withInstructors;
  }

  async create(body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  async update(id: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  async delete(id: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.delete(id);
  }

  async createLesson(courseId: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  async updateLesson(lessonId: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  async deleteLesson(lessonId: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.courseRepository.deleteLesson(lessonId);
  }

  async uploadCover(id: string, file: Express.Multer.File, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  private async attachInstructors(courses: any[]): Promise<any[]> {
    if (!courses.length) return courses;
    const courseIds = courses.map((c) => c.id);
    const links = await this.prisma.courseInstructor.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        instructor: { select: { id: true, name: true, title: true, photoUrl: true } },
      },
    });
    const byId: Record<string, any[]> = {};
    for (const l of links) {
      const arr = byId[l.courseId] || [];
      arr.push(l.instructor);
      byId[l.courseId] = arr;
    }
    return courses.map((c) => ({ ...c, instructors: byId[c.id] ?? [] }));
  }
}
