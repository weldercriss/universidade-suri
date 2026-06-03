import {
  Controller, Get, Query, UseGuards, Req, ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';

@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getReports(
    @Req() req: any,
    @Query('courseId') courseId?: string,
    @Query('trailId') trailId?: string,
    @Query('groupType') groupType?: string,
    @Query('tier') tier?: string,
    @Query('level') level?: string,
    @Query('company') company?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const userWhere: any = { isAdmin: false };
    if (groupType) userWhere.groupType = groupType;
    if (tier) userWhere.tier = tier;
    if (level) userWhere.level = Number(level);
    if (company) userWhere.business = { contains: company, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      userWhere.createdAt = {};
      if (dateFrom) userWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) userWhere.createdAt.lte = new Date(dateTo);
    }

    const enrollWhere: any = {};
    if (courseId) enrollWhere.courseId = courseId;

    const certWhere: any = {};
    if (courseId) certWhere.courseId = courseId;

    const [totalUsers, totalEnrollments, totalCertificates, allAttempts, byGroupRaw, users] =
      await Promise.all([
        this.prisma.profile.count({ where: userWhere }),
        this.prisma.enrollment.count({ where: enrollWhere }),
        this.prisma.certificate.count({ where: certWhere }),
        this.prisma.quizAttempt.findMany({ where: courseId ? { courseId } : {} }),
        this.prisma.profile.groupBy({
          by: ['groupType', 'tier'],
          where: { isAdmin: false },
          _count: { id: true },
        }),
        this.prisma.profile.findMany({
          where: userWhere,
          orderBy: { xp: 'desc' },
          take: 100,
          select: {
            id: true,
            name: true,
            email: true,
            groupType: true,
            tier: true,
            xp: true,
            level: true,
            isActive: true,
            business: true,
            createdAt: true,
          },
        }),
      ]);

    const passedCount = allAttempts.filter((a) => a.passed).length;
    const passRate = allAttempts.length > 0 ? Math.round((passedCount / allAttempts.length) * 100) : 0;

    // Certificados por curso
    const certsByCourse = await this.prisma.certificate.groupBy({
      by: ['courseId'],
      _count: { id: true },
      ...(courseId ? { where: { courseId } } : {}),
    });

    const courseIds = certsByCourse.map((c) => c.courseId).filter(Boolean) as string[];
    const courses = courseIds.length > 0
      ? await this.prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } })
      : [];
    const courseMap = new Map(courses.map((c) => [c.id, c.title]));

    const byCourse = certsByCourse.map((c) => ({
      courseId: c.courseId,
      courseTitle: courseMap.get(c.courseId ?? '') ?? 'Desconhecido',
      certificates: c._count.id,
    }));

    const byGroup = byGroupRaw.map((r) => ({
      groupType: r.groupType,
      tier: r.tier,
      count: r._count.id,
    }));

    return {
      totalUsers,
      totalEnrollments,
      totalCertificates,
      passRate,
      byGroup,
      byCourse,
      users,
    };
  }
}
