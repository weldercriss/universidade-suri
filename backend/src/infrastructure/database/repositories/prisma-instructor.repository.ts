import { Injectable } from '@nestjs/common';
import { IInstructorRepository, InstructorData } from '../../../domain/repositories/instructor.repository.interface';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaInstructorRepository implements IInstructorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<any[]> {
    return this.prisma.instructor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, title: true, bio: true, photoUrl: true },
    });
  }

  async listAll(): Promise<any[]> {
    return this.prisma.instructor.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.instructor.findUnique({ where: { id } });
  }

  async create(data: InstructorData): Promise<any> {
    return this.prisma.instructor.create({ data });
  }

  async update(id: string, data: InstructorData): Promise<any> {
    return this.prisma.instructor.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.instructor.delete({ where: { id } });
  }

  async courseExists(courseId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    return !!course;
  }

  async addToCourse(courseId: string, instructorId: string): Promise<any> {
    return this.prisma.courseInstructor.upsert({
      where: { courseId_instructorId: { courseId, instructorId } },
      create: { courseId, instructorId },
      update: {},
    });
  }

  async removeFromCourse(courseId: string, instructorId: string): Promise<void> {
    await this.prisma.courseInstructor.deleteMany({ where: { courseId, instructorId } });
  }
}
