import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Req,
  Inject, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';

const MAX_ATTEMPTS = 3;

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
  ) {}

  // ─── Admin: CRUD de questões ────────────────────────────────────────────────

  @Post(':courseId/questions')
  @UseGuards(AuthGuard('jwt'))
  async createQuestion(
    @Param('courseId') courseId: string,
    @Body() body: { text: string; options: { id: string; text: string }[]; answer: string },
    @Req() req: any,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    if (!body.text || !body.options || body.options.length < 2 || !body.answer) {
      throw new BadRequestException('text, options (mín. 2) e answer são obrigatórios');
    }

    const optionIds = body.options.map((o) => o.id);
    if (!optionIds.includes(body.answer)) {
      throw new BadRequestException('answer deve ser o id de uma das options');
    }

    const question = await this.prisma.question.create({
      data: {
        courseId,
        text: body.text,
        options: body.options as any,
        answer: body.answer,
      },
    });

    return question;
  }

  @Put('questions/:questionId')
  @UseGuards(AuthGuard('jwt'))
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() body: { text?: string; options?: { id: string; text: string }[]; answer?: string },
    @Req() req: any,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const existing = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!existing) throw new NotFoundException('Questão não encontrada');

    const options = body.options ?? (existing.options as { id: string; text: string }[]);
    const answer = body.answer ?? existing.answer;
    const optionIds = options.map((o) => o.id);
    if (!optionIds.includes(answer)) {
      throw new BadRequestException('answer deve ser o id de uma das options');
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: body.text ?? existing.text,
        options: options as any,
        answer,
      },
    });
  }

  @Delete('questions/:questionId')
  @UseGuards(AuthGuard('jwt'))
  async deleteQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const existing = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!existing) throw new NotFoundException('Questão não encontrada');

    await this.prisma.question.delete({ where: { id: questionId } });
    return { message: 'Questão removida' };
  }

  // ─── Listar questões ────────────────────────────────────────────────────────

  @Get(':courseId/questions')
  @UseGuards(AuthGuard('jwt'))
  async getQuestions(@Param('courseId') courseId: string, @Req() req: any) {
    const questions = await this.prisma.question.findMany({ where: { courseId } });

    if (req.user.isAdmin) return questions;

    // Aluno recebe questões sem gabarito e em ordem aleatória
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.map(({ answer: _answer, ...q }) => q);
  }

  // ─── Status do aluno ─────────────────────────────────────────────────────────

  @Get(':courseId/status')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(@Param('courseId') courseId: string, @Req() req: any) {
    const userId = req.user.id;

    const questionCount = await this.prisma.question.count({ where: { courseId } });

    if (questionCount === 0) {
      return { hasQuestions: false, attemptsUsed: 0, attemptsAllowed: MAX_ATTEMPTS, blocked: false, passed: false, certificateCode: null };
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: 'asc' },
    });

    const passed = attempts.some((a) => a.passed);

    const cert = passed
      ? await this.prisma.certificate.findFirst({ where: { userId, courseId } })
      : null;

    const regularAttempts = attempts.length;

    const extraGranted = await this.prisma.quizExtraAttempt.count({
      where: { userId, courseId },
    });

    const extraUsed = await this.prisma.quizExtraAttempt.count({
      where: { userId, courseId, used: true },
    });

    const attemptsAllowed = MAX_ATTEMPTS + extraGranted;
    const blocked = !passed && regularAttempts >= attemptsAllowed;

    return {
      hasQuestions: true,
      attemptsUsed: regularAttempts,
      attemptsAllowed,
      extraGranted,
      extraUsed,
      blocked,
      passed,
      certificateCode: cert?.verificationCode ?? null,
    };
  }

  // ─── Submeter prova ──────────────────────────────────────────────────────────

  @Post(':courseId/submit')
  @UseGuards(AuthGuard('jwt'))
  async submitQuiz(
    @Param('courseId') courseId: string,
    @Body() body: { answers: { questionId: string; selectedOption: string }[] },
    @Req() req: any,
  ) {
    const userId = req.user.id;

    if (req.user.isAdmin) throw new ForbiddenException('Administradores não realizam provas');

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    // Verificar conclusão das aulas
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Você não está matriculado neste curso');

    const totalLessons = course.lessons.length;
    if (totalLessons > 0) {
      const completedCount = await this.prisma.moduleProgress.count({
        where: { enrollmentId: enrollment.id, isCompleted: true },
      });
      if (completedCount < totalLessons) {
        throw new ForbiddenException('Conclua todas as aulas antes de fazer a prova');
      }
    }

    const questions = await this.prisma.question.findMany({ where: { courseId } });
    if (questions.length === 0) throw new ForbiddenException('Este curso não possui questões cadastradas');

    // Verificar tentativas
    const previousAttempts = await this.prisma.quizAttempt.findMany({ where: { userId, courseId } });
    const alreadyPassed = previousAttempts.some((a) => a.passed);

    if (alreadyPassed) {
      const cert = await this.prisma.certificate.findFirst({ where: { userId, courseId } });
      return { message: 'Você já passou nesta prova', passed: true, certificateCode: cert?.verificationCode };
    }

    const extraGrants = await this.prisma.quizExtraAttempt.findMany({
      where: { userId, courseId, used: false },
      orderBy: { grantedAt: 'asc' },
    });

    const attemptsAllowed = MAX_ATTEMPTS + (await this.prisma.quizExtraAttempt.count({ where: { userId, courseId } }));

    if (previousAttempts.length >= attemptsAllowed) {
      throw new ForbiddenException('Tentativas esgotadas. Solicite nova tentativa ao administrador.');
    }

    // Calcular score
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let correct = 0;

    const answerRecords = (body.answers ?? []).map((a) => {
      const question = questionMap.get(a.questionId);
      const isCorrect = question ? question.answer === a.selectedOption : false;
      if (isCorrect) correct++;
      return { questionId: a.questionId, selectedOption: a.selectedOption, isCorrect };
    });

    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const passed = score >= 70;
    const attemptNumber = previousAttempts.length + 1;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        courseId,
        score,
        passed,
        attemptNumber,
        answers: {
          create: answerRecords,
        },
      },
    });

    // Marcar extra attempt como usado se aplicável
    if (previousAttempts.length >= MAX_ATTEMPTS && extraGrants.length > 0) {
      await this.prisma.quizExtraAttempt.update({
        where: { id: extraGrants[0]!.id },
        data: { used: true },
      });
    }

    let certificateCode: string | null = null;

    if (passed) {
      const existingCert = await this.prisma.certificate.findFirst({ where: { userId, courseId } });
      if (!existingCert) {
        const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
        certificateCode = `UNISURI-${randomHex}`;

        await this.prisma.certificate.create({
          data: { userId, courseId, verificationCode: certificateCode },
        });

        await this.prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { completedAt: new Date() },
        });

        // Conceder XP
        const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
        if (profile) {
          const newXp = profile.xp + course.xpReward;
          await this.prisma.profile.update({
            where: { id: userId },
            data: { xp: newXp, level: Math.floor(newXp / 1000) + 1 },
          });
        }
      } else {
        certificateCode = existingCert.verificationCode;
      }
    }

    const newAttemptsUsed = attemptNumber;
    const totalAllowed = MAX_ATTEMPTS + (await this.prisma.quizExtraAttempt.count({ where: { userId, courseId } }));

    return {
      score: Math.round(score * 10) / 10,
      correct,
      total: questions.length,
      passed,
      attemptNumber,
      attemptsUsed: newAttemptsUsed,
      attemptsAllowed: totalAllowed,
      blocked: !passed && newAttemptsUsed >= totalAllowed,
      certificateCode,
    };
  }

  // ─── Admin: conceder tentativa extra ────────────────────────────────────────

  @Post(':courseId/grant-attempt/:userId')
  @UseGuards(AuthGuard('jwt'))
  async grantAttempt(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    const user = await this.prisma.profile.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.prisma.quizExtraAttempt.create({
      data: {
        userId: targetUserId,
        courseId,
        grantedBy: req.user.id,
      },
    });

    return { message: `Nova tentativa concedida para ${user.name}` };
  }

  // ─── Histórico de provas do usuário autenticado ─────────────────────────────

  @Get('my-attempts')
  @UseGuards(AuthGuard('jwt'))
  async getMyAttempts(@Req() req: any) {
    const userId = req.user.id;
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { title: true } } },
    });
    return attempts.map((a) => ({
      id: a.id,
      courseId: a.courseId,
      courseTitle: (a as any).course?.title ?? 'Curso',
      score: Math.round(a.score * 10) / 10,
      passed: a.passed,
      attemptNumber: a.attemptNumber,
      createdAt: a.createdAt,
    }));
  }

  // ─── Admin: importar questões via JSON ──────────────────────────────────────

  @Post(':courseId/questions/import')
  @UseGuards(AuthGuard('jwt'))
  async importQuestions(
    @Param('courseId') courseId: string,
    @Body() body: { questions: { text: string; options: { id: string; text: string }[]; answer: string }[] },
    @Req() req: any,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      throw new BadRequestException('Envie um array de questões em body.questions');
    }

    for (const q of body.questions) {
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2 || !q.answer) {
        throw new BadRequestException('Cada questão precisa de text, options (mín. 2) e answer');
      }
      const optIds = q.options.map((o) => o.id);
      if (!optIds.includes(q.answer)) {
        throw new BadRequestException(`answer "${q.answer}" não corresponde a nenhuma option em "${q.text}"`);
      }
    }

    await this.prisma.question.createMany({
      data: body.questions.map((q) => ({
        courseId,
        text: q.text,
        options: q.options as any,
        answer: q.answer,
      })),
    });

    return { imported: body.questions.length };
  }

  // ─── Admin: listar alunos bloqueados ────────────────────────────────────────

  @Get(':courseId/blocked-students')
  @UseGuards(AuthGuard('jwt'))
  async getBlockedStudents(@Param('courseId') courseId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true, email: true, tier: true } } },
    });

    // Agrupar por userId
    const byUser = new Map<string, { user: any; count: number; passed: boolean }>();
    for (const a of attempts) {
      const entry = byUser.get(a.userId) ?? { user: a.user, count: 0, passed: false };
      entry.count++;
      if (a.passed) entry.passed = true;
      byUser.set(a.userId, entry);
    }

    const extraGrants = await this.prisma.quizExtraAttempt.findMany({ where: { courseId } });
    const extraByUser = new Map<string, number>();
    for (const eg of extraGrants) {
      extraByUser.set(eg.userId, (extraByUser.get(eg.userId) ?? 0) + 1);
    }

    const result = [];
    for (const [userId, data] of byUser.entries()) {
      const allowed = MAX_ATTEMPTS + (extraByUser.get(userId) ?? 0);
      if (!data.passed && data.count >= allowed) {
        result.push({
          userId,
          name: data.user?.name,
          email: data.user?.email,
          tier: data.user?.tier,
          attemptsUsed: data.count,
          attemptsAllowed: allowed,
        });
      }
    }

    return result;
  }
}
