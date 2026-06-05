import { Controller, Get, Post, Param, UseGuards, Req, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(AuthGuard('jwt'))
export class EnrollmentController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  @ApiOperation({ summary: 'Progresso do aluno em todos os cursos inscritos (admin retorna [])' })
  @ApiResponse({ status: 200, description: 'Array de { courseId, enrollmentId, completedModuleIds, totalModules, completedCount }' })
  @Get('progress')
  async listMyProgress(@Req() req: any) {
    if (req.user.isAdmin) {
      return [];
    }
    const userId = req.user.id;

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

  @ApiOperation({ summary: 'Progresso do aluno em um curso específico' })
  @ApiResponse({ status: 200, description: '{ enrollmentId, completedModuleIds, totalModules, completedCount }' })
  @ApiResponse({ status: 403, description: 'Administradores não cursam' })
  @Get('courses/:courseId/progress')
  async getCourseProgress(@Param('courseId') courseId: string, @Req() req: any) {
    if (req.user.isAdmin) {
      throw new ForbiddenException('Administradores não podem fazer cursos');
    }
    const userId = req.user.id;

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

  @ApiOperation({ summary: 'Inscrição explícita em um curso (catálogo → meus cursos)' })
  @ApiResponse({ status: 201, description: '{ message, enrollmentId }' })
  @ApiResponse({ status: 403, description: 'Administradores não cursam' })
  @Post(':courseId/join')
  async join(@Param('courseId') courseId: string, @Req() req: any) {
    if (req.user.isAdmin) {
      throw new ForbiddenException('Administradores não podem fazer cursos');
    }
    const userId = req.user.id;

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

  @ApiOperation({ summary: 'Marca uma aula como concluída — antifraude sequencial (módulo N exige N-1 concluído)' })
  @ApiResponse({ status: 201, description: '{ message, courseCompleted } — orienta sobre a prova quando curso 100% concluído' })
  @ApiResponse({ status: 403, description: 'Aula anterior não concluída ou admin' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
  @Post('lessons/:lessonId/complete')
  async completeLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    if (req.user.isAdmin) {
      throw new ForbiddenException('Administradores não podem fazer cursos');
    }
    const user = req.user;
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
