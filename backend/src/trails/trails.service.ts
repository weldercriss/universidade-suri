import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

const MAX_TRAIL_ATTEMPTS = 3;

@Injectable()
export class TrailsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(user: any) {
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

    // Buscar inscrições do usuário (não admin)
    let enrolledTrailIds = new Set<string>();
    if (!user.isAdmin) {
      const userEnrollments = await this.prisma.trailEnrollment.findMany({
        where: { userId: user.id },
        select: { trailId: true },
      });
      enrolledTrailIds = new Set(userEnrollments.map((e: any) => e.trailId));
    }

    return trails.map((trail: any) => {
      if (!user.isAdmin) {
        if (trail.targetGroup !== 'all' && trail.targetGroup !== user.groupType) {
          return null;
        }
      }

      const trailCourses = trail.courses.map((tc: any) => tc.course);
      const isActive = trailCourses.length > 0;

      return {
        id: trail.id,
        name: trail.name,
        description: trail.description,
        targetGroup: trail.targetGroup,
        sortOrder: trail.sortOrder,
        isActive,
        isEnrolled: enrolledTrailIds.has(trail.id),
        courses: trail.courses.map((tc: any) => ({
          sortOrder: tc.sortOrder,
          ...tc.course,
        })),
        createdAt: trail.createdAt,
      };
    }).filter(Boolean);
  }

  async enroll(trailId: string, user: any) {
    if (user.isAdmin) throw new ForbiddenException('Administradores não se inscrevem em trilhas');

    const trail = await this.prisma.trail.findUnique({ where: { id: trailId } });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    const userId = user.id;

    const existing = await this.prisma.trailEnrollment.findUnique({
      where: { userId_trailId: { userId, trailId } },
    });

    if (existing) return { message: 'Você já está inscrito nesta trilha' };

    const enrollment = await this.prisma.trailEnrollment.create({
      data: { userId, trailId },
    });

    return { message: 'Inscrição realizada com sucesso', enrollment };
  }

  async getMyEnrollments(user: any) {
    if (user.isAdmin) throw new ForbiddenException('Acesso negado');

    const userId = user.id;

    const enrollments = await this.prisma.trailEnrollment.findMany({
      where: { userId },
      include: {
        trail: {
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
        },
      },
    });

    // Mapa de progresso por curso
    const courseEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { progress: { where: { isCompleted: true } } },
    });

    const progressMap = new Map<string, number>();
    for (const ce of courseEnrollments) {
      if (ce.courseId) progressMap.set(ce.courseId, ce.progress.length);
    }

    // Certificados de trilha já emitidos
    const trailCerts = await this.prisma.trailCertificate.findMany({
      where: { userId },
      select: { trailId: true, verificationCode: true },
    });
    const certMap = new Map(trailCerts.map((c: any) => [c.trailId, c.verificationCode]));

    return enrollments.map((e: any) => {
      const trail = e.trail;
      const courses = trail.courses;
      const totalCourses = courses.length;

      const completedCourses = courses.filter((tc: any) => {
        const totalModules = tc.course.modules.length;
        const done = progressMap.get(tc.course.id) ?? 0;
        return totalModules > 0 && done >= totalModules;
      }).length;

      return {
        enrollmentId: e.id,
        enrolledAt: e.enrolledAt,
        trailId: trail.id,
        trailName: trail.name,
        trailDescription: trail.description,
        targetGroup: trail.targetGroup,
        totalCourses,
        completedCourses,
        progress: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0,
        allCoursesComplete: totalCourses > 0 && completedCourses >= totalCourses,
        certificateCode: certMap.get(trail.id) ?? null,
        courses: courses.map((tc: any) => ({
          sortOrder: tc.sortOrder,
          id: tc.course.id,
          title: tc.course.title,
          description: tc.course.description,
          coverUrl: tc.course.coverUrl,
          workloadHours: tc.course.workloadHours,
          modulesTotal: tc.course.modules.length,
          modulesCompleted: progressMap.get(tc.course.id) ?? 0,
        })),
      };
    });
  }

  async getExamStatus(trailId: string, user: any) {
    if (user.isAdmin) throw new ForbiddenException('Acesso negado');

    const userId = user.id;

    const trail = await this.prisma.trail.findUnique({
      where: { id: trailId },
      include: {
        courses: {
          include: {
            course: {
              include: {
                modules: true,
                questions: { select: { id: true } },
              },
            },
          },
        },
      },
    });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    const enrollment = await this.prisma.trailEnrollment.findUnique({
      where: { userId_trailId: { userId, trailId } },
    });
    if (!enrollment) throw new ForbiddenException('Você não está inscrito nesta trilha');

    // Progresso dos cursos
    const courseEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { progress: { where: { isCompleted: true } } },
    });
    const progressMap = new Map<string, number>();
    for (const ce of courseEnrollments) {
      if (ce.courseId) progressMap.set(ce.courseId, ce.progress.length);
    }

    const allCoursesComplete = (trail as any).courses.every((tc: any) => {
      const total = tc.course.modules.length;
      const done = progressMap.get(tc.course.id) ?? 0;
      return total > 0 && done >= total;
    });

    // Cursos com quiz já aprovado
    const passedCourseAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { courseId: true },
    });
    const passedCourseIds = new Set(passedCourseAttempts.map((a: any) => a.courseId));

    let availableQuestions = 0;
    for (const tc of (trail as any).courses) {
      if (!passedCourseIds.has(tc.courseId)) {
        availableQuestions += tc.course.questions.length;
      }
    }

    const attempts = await this.prisma.trailQuizAttempt.findMany({
      where: { userId, trailId },
      orderBy: { createdAt: 'asc' },
    });

    const alreadyPassed = attempts.some((a: any) => a.passed);
    const trailCert = alreadyPassed
      ? await this.prisma.trailCertificate.findFirst({ where: { userId, trailId } })
      : null;

    return {
      canTakeExam: allCoursesComplete && (availableQuestions > 0 || alreadyPassed),
      allCoursesComplete,
      availableQuestions,
      attemptsUsed: attempts.length,
      attemptsAllowed: MAX_TRAIL_ATTEMPTS,
      blocked: !alreadyPassed && attempts.length >= MAX_TRAIL_ATTEMPTS,
      passed: alreadyPassed,
      certificateCode: (trailCert as any)?.verificationCode ?? null,
    };
  }

  async getExamQuestions(trailId: string, user: any) {
    if (user.isAdmin) throw new ForbiddenException('Acesso negado');

    const userId = user.id;

    const enrollment = await this.prisma.trailEnrollment.findUnique({
      where: { userId_trailId: { userId, trailId } },
    });
    if (!enrollment) throw new ForbiddenException('Você não está inscrito nesta trilha');

    const trail = await this.prisma.trail.findUnique({
      where: { id: trailId },
      include: {
        courses: {
          include: { course: { include: { questions: true } } },
        },
      },
    });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    // Cursos com quiz já aprovado individualmente
    const passedCourseAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { courseId: true },
    });
    const passedCourseIds = new Set(passedCourseAttempts.map((a: any) => a.courseId));

    let questions: any[] = [];
    for (const tc of (trail as any).courses) {
      if (!passedCourseIds.has(tc.courseId)) {
        questions.push(...tc.course.questions);
      }
    }

    // Embaralhar e remover gabarito
    questions = questions.sort(() => Math.random() - 0.5);
    return questions.map(({ answer: _answer, ...q }: any) => q);
  }

  async submitExam(
    trailId: string,
    body: { answers: { questionId: string; selectedOption: string }[] },
    user: any,
  ) {
    if (user.isAdmin) throw new ForbiddenException('Administradores não realizam provas');

    const userId = user.id;

    const enrollment = await this.prisma.trailEnrollment.findUnique({
      where: { userId_trailId: { userId, trailId } },
    });
    if (!enrollment) throw new ForbiddenException('Você não está inscrito nesta trilha');

    const trail = await this.prisma.trail.findUnique({
      where: { id: trailId },
      include: {
        courses: {
          include: {
            course: { include: { questions: true, modules: true } },
          },
        },
      },
    });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    // Verificar que todos os cursos estão concluídos
    const courseEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { progress: { where: { isCompleted: true } } },
    });
    const progressMap = new Map<string, number>();
    for (const ce of courseEnrollments) {
      if (ce.courseId) progressMap.set(ce.courseId, ce.progress.length);
    }

    const allCoursesComplete = (trail as any).courses.every((tc: any) => {
      const total = tc.course.modules.length;
      const done = progressMap.get(tc.course.id) ?? 0;
      return total > 0 && done >= total;
    });
    if (!allCoursesComplete) {
      throw new ForbiddenException('Conclua todos os cursos da trilha antes de fazer a prova');
    }

    // Verificar tentativas anteriores
    const previousAttempts = await this.prisma.trailQuizAttempt.findMany({
      where: { userId, trailId },
    });
    const alreadyPassed = previousAttempts.some((a: any) => a.passed);

    if (alreadyPassed) {
      const cert = await this.prisma.trailCertificate.findFirst({ where: { userId, trailId } });
      return { message: 'Você já passou nesta prova', passed: true, certificateCode: (cert as any)?.verificationCode };
    }

    if (previousAttempts.length >= MAX_TRAIL_ATTEMPTS) {
      throw new ForbiddenException('Tentativas esgotadas para esta trilha');
    }

    // Cursos com quiz aprovado individualmente → excluir suas questões
    const passedCourseAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { courseId: true },
    });
    const passedCourseIds = new Set(passedCourseAttempts.map((a: any) => a.courseId));

    let questions: any[] = [];
    for (const tc of (trail as any).courses) {
      if (!passedCourseIds.has(tc.courseId)) {
        questions.push(...tc.course.questions);
      }
    }

    const trailExamXpRule = await this.prisma.xpRule.findUnique({ where: { action: 'trail_exam' } });
    const trailExamXp = (trailExamXpRule?.isActive && trailExamXpRule.xpValue > 0) ? trailExamXpRule.xpValue : 100;

    // Se todos os cursos foram aprovados individualmente → emite certificado automaticamente
    if (questions.length === 0) {
      const existingCert = await this.prisma.trailCertificate.findFirst({ where: { userId, trailId } });
      if (!existingCert) {
        const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
        const certificateCode = `SURI-TR-${randomHex}`;
        await this.prisma.trailCertificate.create({
          data: { userId, trailId, verificationCode: certificateCode },
        });
        await this.prisma.profile.update({
          where: { id: userId },
          data: { xp: { increment: trailExamXp } },
        });
        return { score: 100, correct: 0, total: 0, passed: true, autoPassed: true, certificateCode };
      }
      return { message: 'Certificado já emitido', passed: true, certificateCode: (existingCert as any).verificationCode };
    }

    // Calcular score
    const questionMap = new Map(questions.map((q: any) => [q.id, q]));
    let correct = 0;

    const answerRecords = (body.answers ?? []).map((a) => {
      const question = questionMap.get(a.questionId) as any;
      const isCorrect = question ? question.answer === a.selectedOption : false;
      if (isCorrect) correct++;
      return { questionId: a.questionId, selectedOption: a.selectedOption, isCorrect };
    });

    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const passed = score >= 70;
    const attemptNumber = previousAttempts.length + 1;

    await this.prisma.trailQuizAttempt.create({
      data: {
        userId,
        trailId,
        score,
        passed,
        attemptNumber,
        answers: { create: answerRecords },
      },
    });

    let certificateCode: string | null = null;

    if (passed) {
      const existingCert = await this.prisma.trailCertificate.findFirst({ where: { userId, trailId } });
      if (!existingCert) {
        const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
        certificateCode = `SURI-TR-${randomHex}`;
        await this.prisma.trailCertificate.create({
          data: { userId, trailId, verificationCode: certificateCode },
        });
        await this.prisma.profile.update({
          where: { id: userId },
          data: { xp: { increment: trailExamXp } },
        });
      } else {
        certificateCode = (existingCert as any).verificationCode;
      }
    }

    return {
      score: Math.round(score * 10) / 10,
      correct,
      total: questions.length,
      passed,
      attemptNumber,
      attemptsUsed: attemptNumber,
      attemptsAllowed: MAX_TRAIL_ATTEMPTS,
      blocked: !passed && attemptNumber >= MAX_TRAIL_ATTEMPTS,
      certificateCode,
    };
  }

  async create(body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    return this.prisma.trail.create({
      data: {
        name: body.name,
        description: body.description,
        targetGroup: body.targetGroup || 'all',
        sortOrder: body.sortOrder || 0,
      },
    });
  }

  async update(id: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
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

  async remove(id: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const existing = await this.prisma.trail.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Trilha não encontrada');
    await this.prisma.trail.delete({ where: { id } });
    return { message: 'Trilha removida com sucesso' };
  }

  async addCourse(trailId: string, body: any, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    const trail = await this.prisma.trail.findUnique({ where: { id: trailId } });
    if (!trail) throw new NotFoundException('Trilha não encontrada');

    return this.prisma.trailCourse.upsert({
      where: { trailId_courseId: { trailId, courseId: body.courseId } },
      create: { trailId, courseId: body.courseId, sortOrder: body.sortOrder || 0 },
      update: { sortOrder: body.sortOrder || 0 },
    });
  }

  async removeCourse(trailId: string, courseId: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');
    await this.prisma.trailCourse.deleteMany({ where: { trailId, courseId } });
    return { message: 'Curso removido da trilha' };
  }
}
