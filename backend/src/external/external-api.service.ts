import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class ExternalApiService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getLeaderboard(limit?: string, groupType?: string) {
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

  async getUser(id: string) {
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

  async listUsers(
    company?: string,
    newsletter?: string,
    groupType?: string,
    tier?: string,
    isActive?: string,
    search?: string,
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

  async getCourse(id: string) {
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

  async listCourses(all?: string) {
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

  async getTrail(id: string) {
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

  async getUserEnrollments(userId: string) {
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

  async getCourseEnrollments(courseId: string) {
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

  async listEnrollments(userId?: string, courseId?: string, completed?: string) {
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

  async validateCertificate(code: string) {
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

  async getUserCertificates(userId: string) {
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

  async listCertificates(userId?: string, courseId?: string) {
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
