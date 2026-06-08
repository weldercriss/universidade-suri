import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyProgress(user: any) {
    if (user.isAdmin) {
      return [];
    }
    const userId = user.id;

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        progress: { where: { isCompleted: true }, select: { moduleId: true } },
        course: { include: { modules: { select: { id: true } } } },
      },
    });

    return enrollments.map((e) => ({
      courseId: e.courseId,
      enrollmentId: e.id,
      completedModuleIds: e.progress.map((p) => p.moduleId),
      totalModules: e.course?.modules.length ?? 0,
      completedCount: e.progress.length,
    }));
  }

  async getCourseProgress(courseId: string, user: any) {
    if (user.isAdmin) {
      throw new ForbiddenException('Administradores não podem fazer cursos');
    }
    const userId = user.id;

    const totalModules = await this.prisma.module.count({ where: { courseId } });

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
      include: {
        progress: { where: { isCompleted: true }, select: { moduleId: true } },
      },
    });

    if (!enrollment) {
      return {
        enrollmentId: null,
        completedModuleIds: [] as string[],
        totalModules,
        completedCount: 0,
      };
    }

    const completedModuleIds = enrollment.progress.map((p) => p.moduleId);

    return {
      enrollmentId: enrollment.id,
      completedModuleIds,
      totalModules,
      completedCount: completedModuleIds.length,
    };
  }

  async join(courseId: string, user: any) {
    if (user.isAdmin) {
      throw new ForbiddenException('Administradores não podem fazer cursos');
    }
    const userId = user.id;

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      return { message: 'Inscrito com sucesso', enrollmentId: existing.id };
    }

    const res = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    return { message: 'Inscrito com sucesso', enrollmentId: res.id };
  }

  async completeLesson(lessonId: string, user: any) {
    if (user.isAdmin) {
      throw new ForbiddenException('Administradores não podem fazer cursos');
    }
    const userId = user.id;

    // Get course id from lesson
    const moduleInfo = await this.prisma.module.findUnique({
      where: { id: lessonId },
    });
    if (!moduleInfo) throw new NotFoundException('Aula não encontrada');
    const courseId = moduleInfo.courseId;

    // Get or create enrollment
    let enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: courseId!,
        },
      },
    });

    if (!enrollment) {
      enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
        },
      });
    }

    // Check if progress already exists
    const progress = await this.prisma.moduleProgress.findUnique({
      where: {
        enrollmentId_moduleId: {
          enrollmentId: enrollment.id,
          moduleId: lessonId,
        },
      },
    });

    if (!progress) {
      const allModules = await this.prisma.module.findMany({
        where: { courseId: courseId! },
        orderBy: { sortOrder: 'asc' },
      });

      const lessonIndex = allModules.findIndex((m) => m.id === lessonId);
      if (lessonIndex === -1) {
        throw new NotFoundException('Aula não encontrada neste curso');
      }

      if (lessonIndex > 0) {
        const previousModule = allModules[lessonIndex - 1]!;
        const previousProgress = await this.prisma.moduleProgress.findUnique({
          where: {
            enrollmentId_moduleId: {
              enrollmentId: enrollment.id,
              moduleId: previousModule.id,
            },
          },
        });

        if (!previousProgress?.isCompleted) {
          throw new ForbiddenException('Conclua a aula anterior antes de avançar');
        }
      }

      await this.prisma.moduleProgress.create({
        data: {
          enrollmentId: enrollment.id,
          moduleId: lessonId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Check if all lessons are completed
      const completedModules = await this.prisma.moduleProgress.count({
        where: { enrollmentId: enrollment.id, isCompleted: true },
      });

      let courseCompleted = false;

      if (completedModules >= allModules.length) {
        // Course is completely done!
        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { completedAt: new Date() },
        });

        courseCompleted = true;
      }

      const msg = courseCompleted
        ? 'Todas as aulas concluídas! Faça a prova para ganhar o XP.'
        : 'Aula concluída!';

      return { message: msg, xp: user.xp, level: user.level, courseCompleted };
    }

    return { message: 'Aula já concluída anteriormente', xp: user.xp, level: user.level };
  }
}
