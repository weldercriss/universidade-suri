import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(AuthGuard('jwt'))
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Progresso do aluno em todos os cursos inscritos (admin retorna [])' })
  @ApiResponse({ status: 200, description: 'Array de { courseId, enrollmentId, completedModuleIds, totalModules, completedCount }' })
  @Get('progress')
  async listMyProgress(@Req() req: any) {
    return this.enrollmentsService.listMyProgress(req.user);
  }

  @ApiOperation({ summary: 'Progresso do aluno em um curso específico' })
  @ApiResponse({ status: 200, description: '{ enrollmentId, completedModuleIds, totalModules, completedCount }' })
  @ApiResponse({ status: 403, description: 'Administradores não cursam' })
  @Get('courses/:courseId/progress')
  async getCourseProgress(@Param('courseId') courseId: string, @Req() req: any) {
    return this.enrollmentsService.getCourseProgress(courseId, req.user);
  }

  @ApiOperation({ summary: 'Inscrição explícita em um curso (catálogo → meus cursos)' })
  @ApiResponse({ status: 201, description: '{ message, enrollmentId }' })
  @ApiResponse({ status: 403, description: 'Administradores não cursam' })
  @Post(':courseId/join')
  async join(@Param('courseId') courseId: string, @Req() req: any) {
    return this.enrollmentsService.join(courseId, req.user);
  }

  @ApiOperation({ summary: 'Marca uma aula como concluída — antifraude sequencial (módulo N exige N-1 concluído)' })
  @ApiResponse({ status: 201, description: '{ message, courseCompleted } — orienta sobre a prova quando curso 100% concluído' })
  @ApiResponse({ status: 403, description: 'Aula anterior não concluída ou admin' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
  @Post('lessons/:lessonId/complete')
  async completeLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.enrollmentsService.completeLesson(lessonId, req.user);
  }
}
