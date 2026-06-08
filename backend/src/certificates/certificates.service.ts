import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { ICourseRepository } from '../domain/repositories/course.repository.interface';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
  ) {}

  async generate(courseId: string, user: any) {
    const userId = user.id;

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    const totalLessons = course.lessons.length;
    if (totalLessons === 0) throw new ForbiddenException('Trilha de aulas vazia');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!enrollment) throw new ForbiddenException('Você não iniciou este curso');

    const completedCount = await this.prisma.moduleProgress.count({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true,
      },
    });

    if (completedCount < totalLessons) {
      throw new ForbiddenException(`Curso incompleto. Concluiu ${completedCount} de ${totalLessons} aulas.`);
    }

    const questionCount = await this.prisma.question.count({ where: { courseId } });
    if (questionCount > 0) {
      const passed = await this.prisma.quizAttempt.findFirst({
        where: { userId, courseId, passed: true },
      });
      if (!passed) {
        throw new ForbiddenException('Você precisa passar na prova do curso para obter o certificado.');
      }
    }

    const existingCert = await this.prisma.certificate.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (existingCert) {
      return { message: 'Certificado já emitido', code: existingCert.verificationCode };
    }

    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const verificationCode = `UNISURI-${randomHex}`;

    await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        verificationCode,
      },
    });

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { completedAt: new Date() },
    });

    return { message: 'Certificado gerado com sucesso!', code: verificationCode };
  }

  async issueManual(courseId: string, targetUserId: string, user: any) {
    if (!user.isAdmin) throw new ForbiddenException('Acesso negado');

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    const verificationCode = `UNISURI-MAN-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    const existingCert = await this.prisma.certificate.findFirst({
      where: { userId: targetUserId, courseId },
    });

    if (existingCert) {
      return { message: 'Certificado já emitido', code: existingCert.verificationCode };
    }

    let enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: targetUserId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      enrollment = await this.prisma.enrollment.create({
        data: {
          userId: targetUserId,
          courseId,
          completedAt: new Date(),
        },
      });
    } else if (!enrollment.completedAt) {
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date() },
      });
    }

    await this.prisma.certificate.create({
      data: {
        userId: targetUserId,
        courseId,
        verificationCode,
      },
    });

    return { message: 'Certificado emitido manualmente pelo Administrador', code: verificationCode };
  }

  async getUserCertificates(user: any) {
    const userId = user.id;

    const [certificates, trailCertificates] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { userId },
        include: { course: true },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.trailCertificate.findMany({
        where: { userId },
        include: { trail: true },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    const all = [
      ...certificates.map((cert) => ({
        id: cert.id,
        courseTitle: cert.course?.title ?? 'Curso',
        verificationCode: cert.verificationCode,
        issuedAt: cert.issuedAt,
        isTrailCertificate: false,
      })),
      ...(trailCertificates as any[]).map((cert) => ({
        id: cert.id,
        courseTitle: `Trilha: ${cert.trail?.name ?? 'Trilha'}`,
        verificationCode: cert.verificationCode,
        issuedAt: cert.issuedAt,
        isTrailCertificate: true,
      })),
    ].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    return { count: all.length, certificates: all };
  }

  async validate(code: string) {
    const targetCode = code.toUpperCase();

    // Verificar certificado de curso
    const cert = await this.prisma.certificate.findUnique({
      where: { verificationCode: targetCode },
      include: { user: true, course: true },
    });

    if (cert) {
      return {
        isValid: true,
        studentName: cert.user?.name,
        group: cert.user?.groupType,
        courseTitle: cert.course?.title,
        workloadHours: `${cert.course?.workloadHours} horas`,
        issuedAt: cert.issuedAt.toLocaleDateString('pt-BR'),
        verificationCode: cert.verificationCode,
        isTrailCertificate: false,
      };
    }

    // Verificar certificado de trilha
    const trailCert = await (this.prisma as any).trailCertificate.findUnique({
      where: { verificationCode: targetCode },
      include: { user: true, trail: true },
    });

    if (trailCert) {
      return {
        isValid: true,
        studentName: trailCert.user?.name,
        group: trailCert.user?.groupType,
        courseTitle: `Trilha: ${trailCert.trail?.name}`,
        workloadHours: '—',
        issuedAt: trailCert.issuedAt.toLocaleDateString('pt-BR'),
        verificationCode: trailCert.verificationCode,
        isTrailCertificate: true,
      };
    }

    throw new NotFoundException('Certificado inválido ou não encontrado');
  }
}
