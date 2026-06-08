import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { ApiTokenGuard } from '../infrastructure/http/guards/api-token.guard';
import { ExternalApiService } from './external-api.service';

@ApiTags('external-api')
@ApiSecurity('api-token')
@Controller('external')
@UseGuards(ApiTokenGuard)
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}

  // ─── STATS ────────────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    return this.externalApiService.getStats();
  }

  // ─── LEADERBOARD ──────────────────────────────────────────────────────────

  @Get('leaderboard')
  @ApiQuery({ name: 'limit', required: false, description: 'Máximo de resultados (padrão 50, máximo 100)' })
  @ApiQuery({ name: 'groupType', required: false, description: 'Filtrar por grupo (embaixador, vip)' })
  async getLeaderboard(
    @Query('limit') limit?: string,
    @Query('groupType') groupType?: string,
  ) {
    return this.externalApiService.getLeaderboard(limit, groupType);
  }

  // ─── USERS ────────────────────────────────────────────────────────────────

  @Get('users/newsletter')
  async listNewsletterSubscribers() {
    return this.externalApiService.listNewsletterSubscribers();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.externalApiService.getUser(id);
  }

  @Get('users')
  @ApiQuery({ name: 'company', required: false, description: 'Filtrar por empresa (busca parcial)' })
  @ApiQuery({ name: 'newsletter', required: false, description: 'Filtrar por newsletter (true/false)' })
  @ApiQuery({ name: 'groupType', required: false, description: 'Filtrar por grupo (embaixador, vip)' })
  @ApiQuery({ name: 'tier', required: false, description: 'Filtrar por tier (número)' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por status (true/false, padrão: true)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou e-mail' })
  async listUsers(
    @Query('company') company?: string,
    @Query('newsletter') newsletter?: string,
    @Query('groupType') groupType?: string,
    @Query('tier') tier?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.externalApiService.listUsers(company, newsletter, groupType, tier, isActive, search);
  }

  // ─── COURSES ──────────────────────────────────────────────────────────────

  @Get('courses/:id')
  async getCourse(@Param('id') id: string) {
    return this.externalApiService.getCourse(id);
  }

  @Get('courses')
  @ApiQuery({ name: 'all', required: false, description: 'Se true, retorna também cursos não publicados' })
  async listCourses(@Query('all') all?: string) {
    return this.externalApiService.listCourses(all);
  }

  // ─── TRAILS ───────────────────────────────────────────────────────────────

  @Get('trails/:id')
  async getTrail(@Param('id') id: string) {
    return this.externalApiService.getTrail(id);
  }

  @Get('trails')
  async listTrails() {
    return this.externalApiService.listTrails();
  }

  // ─── ENROLLMENTS ──────────────────────────────────────────────────────────

  @Get('enrollments/user/:userId')
  async getUserEnrollments(@Param('userId') userId: string) {
    return this.externalApiService.getUserEnrollments(userId);
  }

  @Get('enrollments/course/:courseId')
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    return this.externalApiService.getCourseEnrollments(courseId);
  }

  @Get('enrollments')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'completed', required: false, description: 'true = concluídos, false = em andamento' })
  async listEnrollments(
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
    @Query('completed') completed?: string,
  ) {
    return this.externalApiService.listEnrollments(userId, courseId, completed);
  }

  // ─── CERTIFICATES ─────────────────────────────────────────────────────────

  @Get('certificates/validate/:code')
  async validateCertificate(@Param('code') code: string) {
    return this.externalApiService.validateCertificate(code);
  }

  @Get('certificates/user/:userId')
  async getUserCertificates(@Param('userId') userId: string) {
    return this.externalApiService.getUserCertificates(userId);
  }

  @Get('certificates')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  async listCertificates(
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.externalApiService.listCertificates(userId, courseId);
  }
}
