import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CertificateController } from '../../src/infrastructure/http/controllers/certificate.controller';
import { buildCourseRepoMock, buildPrismaMock, makeAdmin, makeCourse, makeLesson, makeUser } from '../helpers/mocks';

describe('CertificateController', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let courseRepo: ReturnType<typeof buildCourseRepoMock>;
  let controller: CertificateController;

  beforeEach(() => {
    prisma = buildPrismaMock();
    courseRepo = buildCourseRepoMock();
    controller = new CertificateController(prisma as any, courseRepo as any);
  });

  describe('generate (auto)', () => {
    it('NotFound se curso inexistente', async () => {
      courseRepo.findById.mockResolvedValue(null);
      await expect(controller.generate('c1', { user: makeUser({ id: 'u1' }) }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('Forbidden quando trilha de aulas vazia', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, []));
      await expect(controller.generate('c1', { user: makeUser({ id: 'u1' }) }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando aluno não está matriculado', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue(null);
      await expect(controller.generate('c1', { user: makeUser({ id: 'u1' }) }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando curso incompleto (progresso parcial)', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson({ id: 'l1' }), makeLesson({ id: 'l2', sortOrder: 1 })]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1); // concluiu só 1 de 2
      await expect(controller.generate('c1', { user: makeUser({ id: 'u1' }) }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('emite certificado novo quando 100% concluído (formato SURI-AC-XXX)', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson({ id: 'l1' })]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.certificate.findFirst.mockResolvedValue(null);
      prisma.certificate.create.mockResolvedValue({});

      const out = await controller.generate('c1', { user: makeUser({ id: 'u1' }) });
      expect(out.message).toMatch(/sucesso/i);
      expect(out.code).toMatch(/^SURI-AC-[0-9A-F]+$/);
      expect(prisma.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }));
    });

    it('retorna o certificado existente sem duplicar', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.moduleProgress.count.mockResolvedValue(1);
      prisma.certificate.findFirst.mockResolvedValue({ verificationCode: 'SURI-AC-EXIST' });

      const out = await controller.generate('c1', { user: makeUser({ id: 'u1' }) });
      expect(out.code).toBe('SURI-AC-EXIST');
      expect(prisma.certificate.create).not.toHaveBeenCalled();
    });
  });

  describe('issueManual (admin)', () => {
    it('rejeita não-admin', async () => {
      await expect(controller.issueManual('c1', 'u1', { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound se curso não existe', async () => {
      courseRepo.findById.mockResolvedValue(null);
      await expect(controller.issueManual('c1', 'u1', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('admin emite certificado manual mesmo sem matrícula prévia (cria enrollment com completedAt)', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 'e1', completedAt: new Date() });
      prisma.certificate.create.mockResolvedValue({});

      const out = await controller.issueManual('c1', 'u1', { user: makeAdmin() });
      expect(out.code).toMatch(/^SURI-AC-MAN-[0-9A-F]+$/);
      expect(prisma.enrollment.create).toHaveBeenCalled();
    });

    it('atualiza completedAt da matrícula existente ao emitir manual', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.certificate.create.mockResolvedValue({});

      await controller.issueManual('c1', 'u1', { user: makeAdmin() });
      expect(prisma.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }));
    });

    it('ignora erro de duplicidade ao tentar criar certificado existente', async () => {
      courseRepo.findById.mockResolvedValue(makeCourse({}, [makeLesson()]));
      prisma.enrollment.findUnique.mockResolvedValue({ id: 'e1' });
      prisma.certificate.create.mockRejectedValue(new Error('unique constraint'));

      const out = await controller.issueManual('c1', 'u1', { user: makeAdmin() });
      expect(out.message).toMatch(/manualmente/i);
    });
  });

  describe('validate (público)', () => {
    it('NotFound quando código não existe', async () => {
      prisma.certificate.findUnique.mockResolvedValue(null);
      await expect(controller.validate('xyz')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('valida certificado e retorna dados públicos do aluno/curso', async () => {
      const issued = new Date('2026-03-15T10:00:00Z');
      prisma.certificate.findUnique.mockResolvedValue({
        verificationCode: 'SURI-AC-ABCDEF',
        issuedAt: issued,
        user: { name: 'Maria', groupType: 'embaixador' },
        course: { title: 'Curso X', workloadHours: 12 },
      });

      const out = await controller.validate('suri-ac-abcdef'); // testa upper-case interno
      expect(out.isValid).toBe(true);
      expect(out.studentName).toBe('Maria');
      expect(out.group).toBe('embaixador');
      expect(out.courseTitle).toBe('Curso X');
      expect(out.workloadHours).toBe('12 horas');
      expect(out.verificationCode).toBe('SURI-AC-ABCDEF');
      // findUnique deve receber o código em UPPER
      expect(prisma.certificate.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { verificationCode: 'SURI-AC-ABCDEF' },
      }));
    });
  });
});
