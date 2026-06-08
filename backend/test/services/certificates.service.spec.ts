import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CertificatesService } from '../../src/certificates/certificates.service';
import { buildCourseRepoMock, buildPrismaMock, makeAdmin, makeCourse, makeLesson, makeUser } from '../helpers/mocks';

describe('CertificatesService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let courseRepo: ReturnType<typeof buildCourseRepoMock>;
  let service: CertificatesService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    courseRepo = buildCourseRepoMock();
    service = new CertificatesService(prisma as any, courseRepo as any);
  });

  describe('generate (auto)', () => {
    it('NotFound se curso inexistente', async () => {
      courseRepo.findById.mockResolvedValue(null);
      await expect(service.generate('c1', makeUser({ id: 'u1' })))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('Forbidden quando trilha de aulas vazia', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, []));
      await expect(service.generate('c1', makeUser({ id: 'u1' })))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando aluno não está matriculado', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue(null);
      await expect(service.generate('c1', makeUser({ id: 'u1' })))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando curso incompleto (progresso parcial)', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson({ id: 'l1' }), makeLesson({ id: 'l2', sortOrder: 1 })]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      await expect(service.generate('c1', makeUser({ id: 'u1' })))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando curso tem quiz e aluno não passou na prova', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.question.count.mockResolvedValue(5);
      prisma.quizAttempt.findFirst.mockResolvedValue(null);
      await expect(service.generate('c1', makeUser({ id: 'u1' })))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('emite certificado quando 100% concluído e sem quiz (formato UNISURI-XXX)', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson({ id: 'l1' })]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.question.count.mockResolvedValue(0);
      prisma.certificate.findFirst.mockResolvedValue(null);
      prisma.certificate.create.mockResolvedValue({});

      const out = await service.generate('c1', makeUser({ id: 'u1' }));
      expect(out.message).toMatch(/sucesso/i);
      expect(out.code).toMatch(/^UNISURI-[0-9A-F]+$/);
      expect(prisma.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }));
    });

    it('emite certificado quando 100% concluído e passou na prova', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson({ id: 'l1' })]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.question.count.mockResolvedValue(3);
      prisma.quizAttempt.findFirst.mockResolvedValue({ id: 'attempt-1', passed: true });
      prisma.certificate.findFirst.mockResolvedValue(null);
      prisma.certificate.create.mockResolvedValue({});

      const out = await service.generate('c1', makeUser({ id: 'u1' }));
      expect(out.code).toMatch(/^UNISURI-[0-9A-F]+$/);
    });

    it('retorna o certificado existente sem duplicar', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.question.count.mockResolvedValue(0);
      prisma.certificate.findFirst.mockResolvedValue({ verificationCode: 'UNISURI-EXIST' });

      const out = await service.generate('c1', makeUser({ id: 'u1' }));
      expect(out.code).toBe('UNISURI-EXIST');
      expect(prisma.certificate.create).not.toHaveBeenCalled();
    });
  });

  describe('issueManual (admin)', () => {
    it('rejeita não-admin', async () => {
      await expect(service.issueManual('c1', 'u1', makeUser()))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound se curso não existe', async () => {
      courseRepo.findById.mockResolvedValue(null);
      await expect(service.issueManual('c1', 'u1', makeAdmin()))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('admin emite certificado manual mesmo sem matrícula prévia (cria enrollment com completedAt)', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 'e1', completedAt: new Date() });
      prisma.certificate.create.mockResolvedValue({});

      const out = await service.issueManual('c1', 'u1', makeAdmin());
      expect(out.code).toMatch(/^UNISURI-MAN-[0-9A-F]+$/);
      expect(prisma.enrollment.create).toHaveBeenCalled();
    });

    it('atualiza completedAt da matrícula existente ao emitir manual', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.certificate.create.mockResolvedValue({});

      await service.issueManual('c1', 'u1', makeAdmin());
      expect(prisma.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }));
    });
  });

  describe('getUserCertificates', () => {
    it('retorna lista vazia quando não há certificados', async () => {
      prisma.certificate.findMany.mockResolvedValue([]);
      prisma.trailCertificate.findMany.mockResolvedValue([]);

      const out = await service.getUserCertificates(makeUser({ id: 'u1' }));

      expect(out.count).toBe(0);
      expect(out.certificates).toHaveLength(0);
    });

    it('retorna certificados de curso e trilha combinados e ordenados por data', async () => {
      const dateOld = new Date('2026-01-01');
      const dateNew = new Date('2026-06-01');

      prisma.certificate.findMany.mockResolvedValue([
        { id: 'cert-1', verificationCode: 'UNISURI-AAA', issuedAt: dateOld, course: { title: 'Curso A' } },
      ]);
      prisma.trailCertificate.findMany.mockResolvedValue([
        { id: 'trail-cert-1', verificationCode: 'SURI-TR-BBB', issuedAt: dateNew, trail: { name: 'Trilha Dev' } },
      ]);

      const out = await service.getUserCertificates(makeUser({ id: 'u1' }));

      expect(out.count).toBe(2);
      expect(out.certificates[0].verificationCode).toBe('SURI-TR-BBB');
      expect(out.certificates[0].isTrailCertificate).toBe(true);
      expect(out.certificates[0].courseTitle).toBe('Trilha: Trilha Dev');
      expect(out.certificates[1].verificationCode).toBe('UNISURI-AAA');
      expect(out.certificates[1].isTrailCertificate).toBe(false);
    });
  });

  describe('validate (público)', () => {
    it('NotFound quando código não existe em nenhum tipo', async () => {
      prisma.certificate.findUnique.mockResolvedValue(null);
      prisma.trailCertificate.findUnique.mockResolvedValue(null);
      await expect(service.validate('xyz')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('valida certificado de curso e retorna dados públicos', async () => {
      const issued = new Date('2026-03-15T10:00:00Z');
      prisma.certificate.findUnique.mockResolvedValue({
        verificationCode: 'UNISURI-ABCDEF',
        issuedAt: issued,
        user: { name: 'Maria', groupType: 'embaixador' },
        course: { title: 'Curso X', workloadHours: 12 },
      });

      const out = await service.validate('UNISURI-abcdef');
      expect(out.isValid).toBe(true);
      expect(out.studentName).toBe('Maria');
      expect(out.group).toBe('embaixador');
      expect(out.courseTitle).toBe('Curso X');
      expect(out.workloadHours).toBe('12 horas');
      expect(out.verificationCode).toBe('UNISURI-ABCDEF');
      expect(out.isTrailCertificate).toBe(false);
    });

    it('valida certificado de trilha quando código SURI-TR-XXX não encontrado em cursos', async () => {
      const issued = new Date('2026-05-20T10:00:00Z');
      prisma.certificate.findUnique.mockResolvedValue(null);
      prisma.trailCertificate.findUnique.mockResolvedValue({
        verificationCode: 'SURI-TR-ABCDEF',
        issuedAt: issued,
        user: { name: 'João', groupType: 'vip' },
        trail: { name: 'Trilha Dev Full Stack' },
      });

      const out = await service.validate('suri-tr-abcdef');
      expect(out.isValid).toBe(true);
      expect(out.studentName).toBe('João');
      expect(out.group).toBe('vip');
      expect(out.courseTitle).toBe('Trilha: Trilha Dev Full Stack');
      expect(out.workloadHours).toBe('—');
      expect(out.isTrailCertificate).toBe(true);
      expect(out.verificationCode).toBe('SURI-TR-ABCDEF');
    });
  });
});
