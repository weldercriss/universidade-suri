import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TrailsService } from './trails.service';

@ApiTags('trails')
@ApiBearerAuth()
@Controller('trails')
@UseGuards(AuthGuard('jwt'))
export class TrailsController {
  constructor(private readonly trailsService: TrailsService) {}

  // ─── Lista todas as trilhas ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lista trilhas com flag isEnrolled — alunos veem apenas do seu grupo' })
  @ApiResponse({ status: 200, description: 'Array de trilhas com cursos e status de inscrição' })
  @Get()
  async listAll(@Req() req: any) {
    return this.trailsService.listAll(req.user);
  }

  // ─── Inscrição em trilha ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Inscrição explícita do aluno em uma trilha' })
  @ApiResponse({ status: 201, description: 'Inscrição criada ou mensagem de já inscrito' })
  @ApiResponse({ status: 403, description: 'Administradores não se inscrevem' })
  @ApiResponse({ status: 404, description: 'Trilha não encontrada' })
  @Post(':id/enroll')
  async enroll(@Param('id') trailId: string, @Req() req: any) {
    return this.trailsService.enroll(trailId, req.user);
  }

  // ─── Minhas trilhas (inscrições com progresso) ────────────────────────────────

  @ApiOperation({ summary: 'Trilhas inscritas com progresso, cursos e certificado de trilha' })
  @ApiResponse({ status: 200, description: 'Array de inscrições com progresso calculado e certificateCode' })
  @ApiResponse({ status: 403, description: 'Administradores não têm trilhas' })
  @Get('my-enrollments')
  async getMyEnrollments(@Req() req: any) {
    return this.trailsService.getMyEnrollments(req.user);
  }

  // ─── Status do exame da trilha ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Status do exame final da trilha — tentativas, desbloqueio e certificado' })
  @ApiResponse({ status: 200, description: '{ canTakeExam, allCoursesComplete, attemptsUsed, attemptsAllowed, blocked, passed, certificateCode }' })
  @ApiResponse({ status: 403, description: 'Admin ou não inscrito' })
  @ApiResponse({ status: 404, description: 'Trilha não encontrada' })
  @Get(':id/exam/status')
  async getExamStatus(@Param('id') trailId: string, @Req() req: any) {
    return this.trailsService.getExamStatus(trailId, req.user);
  }

  // ─── Questões do exame da trilha ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Questões embaralhadas do exame — exclui cursos já aprovados individualmente' })
  @ApiResponse({ status: 200, description: 'Array de questões sem gabarito (campo answer removido)' })
  @ApiResponse({ status: 403, description: 'Admin ou não inscrito' })
  @Get(':id/exam/questions')
  async getExamQuestions(@Param('id') trailId: string, @Req() req: any) {
    return this.trailsService.getExamQuestions(trailId, req.user);
  }

  // ─── Submeter exame da trilha ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Submete respostas do exame — ≥70% aprova e emite certificado SURI-TR-XXXXXX (+100 XP)' })
  @ApiResponse({ status: 201, description: '{ score, correct, total, passed, certificateCode }' })
  @ApiResponse({ status: 403, description: 'Admin, não inscrito, cursos incompletos ou tentativas esgotadas' })
  @Post(':id/exam/submit')
  async submitExam(
    @Param('id') trailId: string,
    @Body() body: { answers: { questionId: string; selectedOption: string }[] },
    @Req() req: any,
  ) {
    return this.trailsService.submitExam(trailId, body, req.user);
  }

  // ─── Admin: CRUD de trilhas ───────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Cria uma nova trilha' })
  @ApiResponse({ status: 201, description: 'Trilha criada' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.trailsService.create(body, req.user);
  }

  @ApiOperation({ summary: '[Admin] Atualiza dados de uma trilha' })
  @ApiResponse({ status: 200, description: 'Trilha atualizada' })
  @ApiResponse({ status: 404, description: 'Trilha não encontrada' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.trailsService.update(id, body, req.user);
  }

  @ApiOperation({ summary: '[Admin] Remove uma trilha (cascade delete nos cursos relacionados)' })
  @ApiResponse({ status: 200, description: 'Trilha removida' })
  @ApiResponse({ status: 404, description: 'Trilha não encontrada' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.trailsService.remove(id, req.user);
  }

  @ApiOperation({ summary: '[Admin] Adiciona ou atualiza curso em uma trilha (upsert por sortOrder)' })
  @ApiResponse({ status: 201, description: 'Curso adicionado à trilha' })
  @ApiResponse({ status: 404, description: 'Trilha não encontrada' })
  @Post(':id/courses')
  async addCourse(@Param('id') trailId: string, @Body() body: any, @Req() req: any) {
    return this.trailsService.addCourse(trailId, body, req.user);
  }

  @ApiOperation({ summary: '[Admin] Remove curso de uma trilha' })
  @ApiResponse({ status: 200, description: 'Curso removido da trilha' })
  @Delete(':id/courses/:courseId')
  async removeCourse(
    @Param('id') trailId: string,
    @Param('courseId') courseId: string,
    @Req() req: any,
  ) {
    return this.trailsService.removeCourse(trailId, courseId, req.user);
  }
}
