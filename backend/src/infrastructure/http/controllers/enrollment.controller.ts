import { Controller, Post, Param, UseGuards, Req, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';

@Controller('enrollments')
@UseGuards(AuthGuard('jwt'))
export class EnrollmentController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

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
      await this.prisma.moduleProgress.create({
        data: {
          enrollmentId: enrollment.id,
          moduleId: lessonId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Check if all lessons are completed
      const allModules = await this.prisma.module.findMany({
        where: { courseId: courseId! },
      });
      
      const completedModules = await this.prisma.moduleProgress.count({
        where: { enrollmentId: enrollment.id, isCompleted: true },
      });

      let xpAdded = 0;
      let courseCompleted = false;

      if (completedModules >= allModules.length) {
        // Course is completely done!
        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { completedAt: new Date() },
        });

        // Get course to know xpReward
        const course = await this.prisma.course.findUnique({ where: { id: courseId! } });
        const reward = course?.xpReward || 0;
        
        if (reward > 0) {
          user.addXp(reward);
          await this.userRepository.update(user);
          xpAdded = reward;
        }
        courseCompleted = true;
      }

      const msg = courseCompleted 
        ? `Curso concluído! +${xpAdded} XP adicionado!` 
        : 'Aula concluída!';
        
      return { message: msg, xp: user.xp, level: user.level, courseCompleted };
    }

    return { message: 'Aula já concluída anteriormente', xp: user.xp, level: user.level };
  }
}
