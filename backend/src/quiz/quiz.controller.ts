import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ─── Admin: CRUD de questões ────────────────────────────────────────────────

  @Post(':courseId/questions')
  @UseGuards(AuthGuard('jwt'))
  async createQuestion(
    @Param('courseId') courseId: string,
    @Body() body: { text: string; options: { id: string; text: string }[]; answer: string },
    @Req() req: any,
  ) {
    return this.quizService.createQuestion(courseId, body, req.user);
  }

  @Put('questions/:questionId')
  @UseGuards(AuthGuard('jwt'))
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() body: { text?: string; options?: { id: string; text: string }[]; answer?: string },
    @Req() req: any,
  ) {
    return this.quizService.updateQuestion(questionId, body, req.user);
  }

  @Delete('questions/:questionId')
  @UseGuards(AuthGuard('jwt'))
  async deleteQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    return this.quizService.deleteQuestion(questionId, req.user);
  }

  // ─── Listar questões ────────────────────────────────────────────────────────

  @Get(':courseId/questions')
  @UseGuards(AuthGuard('jwt'))
  async getQuestions(@Param('courseId') courseId: string, @Req() req: any) {
    return this.quizService.getQuestions(courseId, req.user);
  }

  // ─── Status do aluno ─────────────────────────────────────────────────────────

  @Get(':courseId/status')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(@Param('courseId') courseId: string, @Req() req: any) {
    return this.quizService.getStatus(courseId, req.user);
  }

  // ─── Submeter prova ──────────────────────────────────────────────────────────

  @Post(':courseId/submit')
  @UseGuards(AuthGuard('jwt'))
  async submitQuiz(
    @Param('courseId') courseId: string,
    @Body() body: { answers: { questionId: string; selectedOption: string }[] },
    @Req() req: any,
  ) {
    return this.quizService.submitQuiz(courseId, body, req.user);
  }

  // ─── Admin: conceder tentativa extra ────────────────────────────────────────

  @Post(':courseId/grant-attempt/:userId')
  @UseGuards(AuthGuard('jwt'))
  async grantAttempt(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    return this.quizService.grantAttempt(courseId, targetUserId, req.user);
  }

  // ─── Histórico de provas do usuário autenticado ─────────────────────────────

  @Get('my-attempts')
  @UseGuards(AuthGuard('jwt'))
  async getMyAttempts(@Req() req: any) {
    return this.quizService.getMyAttempts(req.user);
  }

  // ─── Admin: importar questões via JSON ──────────────────────────────────────

  @Post(':courseId/questions/import')
  @UseGuards(AuthGuard('jwt'))
  async importQuestions(
    @Param('courseId') courseId: string,
    @Body() body: { questions: { text: string; options: { id: string; text: string }[]; answer: string }[] },
    @Req() req: any,
  ) {
    return this.quizService.importQuestions(courseId, body, req.user);
  }

  // ─── Admin: listar alunos bloqueados ────────────────────────────────────────

  @Get(':courseId/blocked-students')
  @UseGuards(AuthGuard('jwt'))
  async getBlockedStudents(@Param('courseId') courseId: string, @Req() req: any) {
    return this.quizService.getBlockedStudents(courseId, req.user);
  }
}
