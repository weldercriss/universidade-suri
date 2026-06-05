import { Controller, Post, Get, Param, UseGuards, Req, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';

@ApiTags('certificates')
@Controller('certificates')
export class CertificateController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ICourseRepository)
    private readonly courseRepository: ICourseRepository,
  ) { }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gera certificado automático de curso após 100% concluído e prova aprovada' })
  @ApiResponse({ status: 201, description: 'Certificado gerado — código UNISURI-XXXXXX' })
  @ApiResponse({ status: 403, description: 'Curso incompleto, sem matrícula ou prova não aprovada' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
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

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Emite certificado manual para um aluno — código UNISURI-MAN-XXXXXX' })
  @ApiResponse({ status: 201, description: 'Certificado emitido manualmente' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @Post(':courseId/issue-manual/:targetUserId')
  @UseGuards(AuthGuard('jwt'))
  async issueManual(@Param('courseId') courseId: string, @Param('targetUserId') targetUserId: string, @Req() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException('Acesso negado');

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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os certificados do usuário autenticado (cursos + trilhas)' })
  @ApiResponse({ status: 200, description: '{ count, certificates[] } — inclui isTrailCertificate' })
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getUserCertificates(@Req() req: any) {
    const user = req.user;
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

  @ApiOperation({ summary: 'Validação pública de certificado por código (sem autenticação) — suporta cursos e trilhas' })
  @ApiResponse({ status: 200, description: 'Certificado válido — retorna dados do aluno e curso/trilha' })
  @ApiResponse({ status: 404, description: 'Código não encontrado' })
  @Get('validate/:code')
  async validate(@Param('code') code: string) {
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
