import { Controller, Get, Param, Query, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { ApiTokenGuard } from '../guards/api-token.guard';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('external-api')
@ApiSecurity('api-token')
@Controller('external')
@UseGuards(ApiTokenGuard)
export class ExternalApiController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── STATS ────────────────────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    const [
      totalUsers,
      totalCourses,
      totalTrails,
      totalEnrollments,
      totalCourseCertificates,
      totalTrailCertificates,
      newsletterSubscribers,
    ] = await Promise.all([
      this.prisma.profile.count({ where: { isActive: true, isAdmin: false } }),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.trail.count(),
      this.prisma.enrollment.count(),
      this.prisma.certificate.count(),
      this.prisma.trailCertificate.count(),
      this.prisma.profile.count({ where: { newsletter: true, isActive: true } }),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalTrails,
      totalEnrollments,
      totalCertificates: totalCourseCertificates + totalTrailCertificates,
      newsletterSubscribers,
    };
  }

  // ─── LEADERBOARD ──────────────────────────────────────────────────────────

  @Get('leaderboard')
  @ApiQuery({ name: 'limit', required: false, description: 'Máximo de resultados (padrão 50, máximo 100)' })
  @ApiQuery({ name: 'groupType', required: false, description: 'Filtrar por grupo (embaixador, vip)' })
  async getLeaderboard(
    @Query('limit') limit?: string,
    @Query('groupType') groupType?: string,
  ) {
    const take = Math.min(parseInt(limit ?? '50') || 50, 100);

    return this.prisma.profile.findMany({
      where: {
        isActive: true,
        isAdmin: false,
        ...(groupType && { groupType }),
      },
      select: {
        id: true,
        name: true,
        groupType: true,
        tier: true,
        level: true,
        xp: true,
        profileImage: true,
      },
      orderBy: { xp: 'desc' },
      take,
    });
  }

  // ─── USERS ────────────────────────────────────────────────────────────────

  @Get('users/newsletter')
  async listNewsletterSubscribers() {
    return this.prisma.profile.findMany({
      where: { newsletter: true, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        groupType: true,
        tier: true,
        business: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        groupType: true,
        tier: true,
        level: true,
        xp: true,
        isAdmin: true,
        isActive: true,
        business: true,
        phone: true,
        newsletter: true,
        profileImage: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            trailEnrollments: true,
            trailCertificates: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
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
    const where: Record<string, unknown> = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    else where.isActive = true;

    if (company) where.business = { contains: company, mode: 'insensitive' };
    if (newsletter !== undefined) where.newsletter = newsletter === 'true';
    if (groupType) where.groupType = groupType;
    if (tier !== undefined) where.tier = parseInt(tier);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.profile.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        groupType: true,
        tier: true,
        level: true,
        xp: true,
        isActive: true,
        business: true,
        phone: true,
        newsletter: true,
        profileImage: true,
        createdAt: true,
        _count: { select: { enrollments: true, certificates: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ─── COURSES ──────────────────────────────────────────────────────────────

  @Get('courses/:id')
  async getCourse(@Param('id') id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        workloadHours: true,
        xpReward: true,
        coverUrl: true,
        targetGroup: true,
        isPublished: true,
        createdAt: true,
        modules: {
          select: { id: true, title: true, duration: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { enrollments: true, certificates: true } },
      },
    });

    if (!course) throw new NotFoundException('Curso não encontrado');
    return course;
  }

  @Get('courses')
  @ApiQuery({ name: 'all', required: false, description: 'Se true, retorna também cursos não publicados' })
  async listCourses(@Query('all') all?: string) {
    return this.prisma.course.findMany({
      where: all === 'true' ? {} : { isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        workloadHours: true,
        xpReward: true,
        coverUrl: true,
        targetGroup: true,
        isPublished: true,
        createdAt: true,
        _count: { select: { modules: true, enrollments: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── TRAILS ───────────────────────────────────────────────────────────────

  @Get('trails/:id')
  async getTrail(@Param('id') id: string) {
    const trail = await this.prisma.trail.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        targetGroup: true,
        sortOrder: true,
        createdAt: true,
        courses: {
          select: {
            sortOrder: true,
            course: {
              select: {
                id: true,
                title: true,
                workloadHours: true,
                xpReward: true,
                coverUrl: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { enrollments: true, certificates: true } },
      },
    });

    if (!trail) throw new NotFoundException('Trilha não encontrada');
    return trail;
  }

  @Get('trails')
  async listTrails() {
    return this.prisma.trail.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        targetGroup: true,
        sortOrder: true,
        createdAt: true,
        _count: { select: { courses: true, enrollments: true, certificates: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── ENROLLMENTS ──────────────────────────────────────────────────────────

  @Get('enrollments/user/:userId')
  async getUserEnrollments(@Param('userId') userId: string) {
    const user = await this.prisma.profile.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return this.prisma.enrollment.findMany({
      where: { userId },
      select: {
        id: true,
        enrolledAt: true,
        completedAt: true,
        course: { select: { id: true, title: true, workloadHours: true, xpReward: true } },
        _count: { select: { progress: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  @Get('enrollments/course/:courseId')
  async getCourseEnrollments(@Param('courseId') courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    return this.prisma.enrollment.findMany({
      where: { courseId },
      select: {
        id: true,
        enrolledAt: true,
        completedAt: true,
        user: {
          select: { id: true, name: true, email: true, groupType: true, tier: true, business: true },
        },
        _count: { select: { progress: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
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
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;
    if (completed === 'true') where.completedAt = { not: null };
    if (completed === 'false') where.completedAt = null;

    return this.prisma.enrollment.findMany({
      where,
      select: {
        id: true,
        enrolledAt: true,
        completedAt: true,
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        _count: { select: { progress: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 500,
    });
  }

  // ─── CERTIFICATES ─────────────────────────────────────────────────────────

  @Get('certificates/validate/:code')
  async validateCertificate(@Param('code') code: string) {
    const courseCert = await this.prisma.certificate.findFirst({
      where: { verificationCode: code },
      select: {
        verificationCode: true,
        issuedAt: true,
        user: { select: { id: true, name: true } },
        course: { select: { id: true, title: true, workloadHours: true } },
      },
    });
    if (courseCert) return { type: 'course', ...courseCert };

    const trailCert = await this.prisma.trailCertificate.findFirst({
      where: { verificationCode: code },
      select: {
        verificationCode: true,
        issuedAt: true,
        user: { select: { id: true, name: true } },
        trail: { select: { id: true, name: true } },
      },
    });
    if (trailCert) return { type: 'trail', ...trailCert };

    throw new NotFoundException('Certificado não encontrado');
  }

  @Get('certificates/user/:userId')
  async getUserCertificates(@Param('userId') userId: string) {
    const user = await this.prisma.profile.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const [courseCertificates, trailCertificates] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { userId },
        select: {
          id: true,
          verificationCode: true,
          issuedAt: true,
          course: { select: { id: true, title: true, workloadHours: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.trailCertificate.findMany({
        where: { userId },
        select: {
          id: true,
          verificationCode: true,
          issuedAt: true,
          trail: { select: { id: true, name: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    return { courseCertificates, trailCertificates };
  }

  @Get('certificates')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  async listCertificates(
    @Query('userId') userId?: string,
    @Query('courseId') courseId?: string,
  ) {
    const courseCertsWhere: Record<string, unknown> = {};
    if (userId) courseCertsWhere.userId = userId;
    if (courseId) courseCertsWhere.courseId = courseId;

    const courseCertificates = await this.prisma.certificate.findMany({
      where: courseCertsWhere,
      select: {
        id: true,
        verificationCode: true,
        issuedAt: true,
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, workloadHours: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 500,
    });

    if (courseId) return { courseCertificates, trailCertificates: [] };

    const trailCertificates = await this.prisma.trailCertificate.findMany({
      where: userId ? { userId } : {},
      select: {
        id: true,
        verificationCode: true,
        issuedAt: true,
        user: { select: { id: true, name: true, email: true } },
        trail: { select: { id: true, name: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 500,
    });

    return { courseCertificates, trailCertificates };
  }
}
