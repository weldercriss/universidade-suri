import { Controller, Post, Get, Param, UseGuards, Req, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';

@Controller('certificates')
export class CertificateController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
  ) {}

  @Post(':courseId/generate')
  @UseGuards(AuthGuard('jwt'))
  async generate(@Param('courseId') courseId: string, @Req() req: any) {
    const user = req.user;
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
    const verificationCode = `SURI-AC-${randomHex}`;

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

  @Post(':courseId/issue-manual/:targetUserId')
  @UseGuards(AuthGuard('jwt'))
  async issueManual(@Param('courseId') courseId: string, @Param('targetUserId') targetUserId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso não encontrado');

    const verificationCode = `SURI-AC-MAN-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

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
    } else {
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date() },
      });
    }

    try {
      await this.prisma.certificate.create({
        data: {
          userId: targetUserId,
          courseId,
          verificationCode,
        },
      });
    } catch (e) {
      // Ignora erro de duplicidade
    }

    return { message: 'Certificado emitido manualmente pelo Administrador', code: verificationCode };
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getUserCertificates(@Req() req: any) {
    const user = req.user;
    const userId = user.id;

    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return {
      count: certificates.length,
      certificates: certificates.map((cert) => ({
        id: cert.id,
        courseTitle: cert.course?.title,
        verificationCode: cert.verificationCode,
        issuedAt: cert.issuedAt,
      })),
    };
  }

  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    const targetCode = code.toUpperCase();

    const cert = await this.prisma.certificate.findUnique({
      where: { verificationCode: targetCode },
      include: {
        user: true,
        course: true,
      },
    });

    if (!cert) {
      throw new NotFoundException('Certificado inválido ou não encontrado');
    }

    return {
      isValid: true,
      studentName: cert.user?.name,
      group: cert.user?.groupType,
      courseTitle: cert.course?.title,
      workloadHours: `${cert.course?.workloadHours} horas`,
      issuedAt: cert.issuedAt.toLocaleDateString('pt-BR'),
      verificationCode: cert.verificationCode,
    };
  }
}
