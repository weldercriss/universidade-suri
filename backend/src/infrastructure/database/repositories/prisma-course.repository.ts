import { Injectable, Logger } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { Course, Lesson } from '../../../domain/entities/course.entity';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  private readonly logger = new Logger(PrismaCourseRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<Course[]> {
    try {
      const rows = await this.prisma.course.findMany({
        include: { modules: { orderBy: { sortOrder: 'asc' } } },
      });
      return rows.map(r => this.mapCourseRow(r, r.modules));
    } catch (e) {
      this.logger.error('Error listing all courses', e);
      return [];
    }
  }

  async listAllPublished(targetGroup: string): Promise<Course[]> {
    try {
      const rows = await this.prisma.course.findMany({
        where: {
          isPublished: true,
          targetGroup: {
            in: ['all', targetGroup],
          },
        },
        include: { modules: { orderBy: { sortOrder: 'asc' } } },
      });
      return rows.map(r => this.mapCourseRow(r, r.modules));
    } catch (e) {
      this.logger.error('Error listing published courses', e);
      return [];
    }
  }

  async findById(id: string): Promise<Course | null> {
    try {
      const row = await this.prisma.course.findUnique({
        where: { id },
        include: { modules: { orderBy: { sortOrder: 'asc' } } },
      });
      if (!row) return null;
      return this.mapCourseRow(row, row.modules);
    } catch (e) {
      this.logger.error('Error finding course by id', e);
      return null;
    }
  }

  async create(course: Course): Promise<Course> {
    try {
      const row = await this.prisma.course.create({
        data: {
          id: course.id || undefined,
          title: course.title,
          description: course.description,
          workloadHours: course.workloadHours,
          xpReward: course.xpReward,
          coverUrl: course.coverUrl,
          targetGroup: course.targetGroup,
          isPublished: course.isPublished,
          createdAt: course.createdAt,
        },
      });
      return this.mapCourseRow(row, []);
    } catch (e) {
      this.logger.error('Error creating course', e);
      throw e;
    }
  }

  async update(course: Course): Promise<Course> {
    try {
      const row = await this.prisma.course.update({
        where: { id: course.id },
        data: {
          title: course.title,
          description: course.description,
          workloadHours: course.workloadHours,
          xpReward: course.xpReward,
          coverUrl: course.coverUrl,
          targetGroup: course.targetGroup,
          isPublished: course.isPublished,
        },
      });
      return this.findById(course.id) as Promise<Course>;
    } catch (e) {
      this.logger.error('Error updating course', e);
      throw e;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.course.delete({ where: { id } });
      return true;
    } catch (e) {
      this.logger.error('Error deleting course', e);
      return false;
    }
  }

  async findLessonById(id: string): Promise<Lesson | null> {
    try {
      const row = await this.prisma.module.findUnique({
        where: { id },
      });
      if (!row) return null;
      return this.mapLessonRow(row);
    } catch (e) {
      this.logger.error('Error finding lesson', e);
      return null;
    }
  }

  async createLesson(lesson: Lesson): Promise<Lesson> {
    try {
      const row = await this.prisma.module.create({
        data: {
          id: lesson.id || undefined,
          courseId: lesson.courseId,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          sortOrder: lesson.sortOrder,
        },
      });
      return this.mapLessonRow(row);
    } catch (e) {
      this.logger.error('Error creating lesson', e);
      throw e;
    }
  }

  async updateLesson(lesson: Lesson): Promise<Lesson> {
    try {
      const row = await this.prisma.module.update({
        where: { id: lesson.id },
        data: {
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          sortOrder: lesson.sortOrder,
        },
      });
      return this.mapLessonRow(row);
    } catch (e) {
      this.logger.error('Error updating lesson', e);
      throw e;
    }
  }

  async deleteLesson(id: string): Promise<boolean> {
    try {
      await this.prisma.module.delete({ where: { id } });
      return true;
    } catch (e) {
      this.logger.error('Error deleting lesson', e);
      return false;
    }
  }

  private mapCourseRow(row: any, modules: any[] = []): Course {
    const course = new Course(
      row.id,
      row.title,
      row.description,
      row.workloadHours,
      row.xpReward,
      row.coverUrl,
      row.targetGroup,
      row.isPublished,
      new Date(row.createdAt)
    );
    if (modules && modules.length > 0) {
      course.lessons = modules.map(m => this.mapLessonRow(m));
    }
    return course;
  }

  private mapLessonRow(row: any): Lesson {
    return new Lesson(
      row.id,
      row.courseId,
      row.title,
      row.description,
      row.content,
      row.videoUrl,
      row.duration,
      row.sortOrder
    );
  }
}
