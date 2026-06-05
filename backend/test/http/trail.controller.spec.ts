import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TrailController } from '../../src/infrastructure/http/controllers/trail.controller';
import { buildPrismaMock, makeAdmin, makeUser } from '../helpers/mocks';

describe('TrailController', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let controller: TrailController;

  const makeTrail = (overrides: any = {}) => ({
    id: overrides.id ?? 'trail-1',
    name: overrides.name ?? 'Trilha Dev Full Stack',
    description: overrides.description ?? 'Descrição da trilha',
    targetGroup: overrides.targetGroup ?? 'all',
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    courses: overrides.courses ?? [],
  });

  const makeCourseModule = (id: string) => ({ id, sortOrder: 0 });

  const makeTrailCourse = (courseId: string, modules: any[] = [], questions: any[] = []) => ({
    courseId,
    sortOrder: 0,
    course: {
      id: courseId,
      title: `Curso ${courseId}`,
      description: 'desc',
      coverUrl: 'cover.png',
      workloadHours: 10,
      modules,
      questions,
    },
  });

  beforeEach(() => {
    prisma = buildPrismaMock();
    controller = new TrailController(prisma as any);
  });

  // ─── listAll ─────────────────────────────────────────────────────────────────

  describe('listAll', () => {
    it('admin vê todas as trilhas sem verificação de inscrição', async () => {
      prisma.trail.findMany.mockResolvedValue([makeTrail()]);

      const out = await controller.listAll({ user: makeAdmin() });

      expect(out).toHaveLength(1);
      expect(prisma.trailEnrollment.findMany).not.toHaveBeenCalled();
    });

    it('aluno vê trilhas do seu grupo com flag isEnrolled', async () => {
      prisma.trail.findMany.mockResolvedValue([
        makeTrail({ id: 'trail-1', targetGroup: 'embaixador' }),
      ]);
      prisma.trailEnrollment.findMany.mockResolvedValue([{ trailId: 'trail-1' }]);

      const out = await controller.listAll({ user: makeUser({ groupType: 'embaixador' as any }) });

      expect(out[0].isEnrolled).toBe(true);
    });

    it('aluno não vê trilha de grupo diferente', async () => {
      prisma.trail.findMany.mockResolvedValue([
        makeTrail({ id: 'trail-1', targetGroup: 'vip' }),
      ]);
      prisma.trailEnrollment.findMany.mockResolvedValue([]);

      const out = await controller.listAll({ user: makeUser({ groupType: 'embaixador' as any }) });

      expect(out).toHaveLength(0);
    });

    it('trilha com targetGroup "all" visível para qualquer grupo', async () => {
      prisma.trail.findMany.mockResolvedValue([makeTrail({ targetGroup: 'all' })]);
      prisma.trailEnrollment.findMany.mockResolvedValue([]);

      const out = await controller.listAll({ user: makeUser({ groupType: 'vip' as any }) });

      expect(out).toHaveLength(1);
      expect(out[0].isEnrolled).toBe(false);
    });
  });

  // ─── enroll ──────────────────────────────────────────────────────────────────

  describe('enroll', () => {
    it('admin não pode se inscrever em trilha', async () => {
      await expect(controller.enroll('trail-1', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound quando trilha não existe', async () => {
      prisma.trail.findUnique.mockResolvedValue(null);
      await expect(controller.enroll('trilha-inexistente', { user: makeUser() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('retorna mensagem informativa se já inscrito', async () => {
      prisma.trail.findUnique.mockResolvedValue(makeTrail());
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });

      const out = await controller.enroll('trail-1', { user: makeUser({ id: 'u1' }) });

      expect(out.message).toMatch(/já está inscrito/i);
      expect(prisma.trailEnrollment.create).not.toHaveBeenCalled();
    });

    it('cria inscrição nova quando não existia', async () => {
      prisma.trail.findUnique.mockResolvedValue(makeTrail());
      prisma.trailEnrollment.findUnique.mockResolvedValue(null);
      prisma.trailEnrollment.create.mockResolvedValue({ id: 'enroll-2' });

      const out = await controller.enroll('trail-1', { user: makeUser({ id: 'u1' }) });

      expect(out.message).toMatch(/sucesso/i);
      expect(prisma.trailEnrollment.create).toHaveBeenCalledWith({
        data: { userId: 'u1', trailId: 'trail-1' },
      });
    });
  });

  // ─── getMyEnrollments ────────────────────────────────────────────────────────

  describe('getMyEnrollments', () => {
    it('admin recebe ForbiddenException', async () => {
      await expect(controller.getMyEnrollments({ user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('retorna progresso calculado de cada trilha inscrita', async () => {
      prisma.trailEnrollment.findMany.mockResolvedValue([
        {
          id: 'enroll-1',
          enrolledAt: new Date(),
          trail: makeTrail({
            courses: [
              makeTrailCourse('c1', [makeCourseModule('m1'), makeCourseModule('m2')]),
            ],
          }),
        },
      ]);
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }, { moduleId: 'm2' }] },
      ]);
      prisma.trailCertificate.findMany.mockResolvedValue([]);

      const out = await controller.getMyEnrollments({ user: makeUser({ id: 'u1' }) });

      expect(out).toHaveLength(1);
      expect(out[0].completedCourses).toBe(1);
      expect(out[0].totalCourses).toBe(1);
      expect(out[0].progress).toBe(100);
      expect(out[0].allCoursesComplete).toBe(true);
    });

    it('certificado de trilha incluído quando emitido', async () => {
      prisma.trailEnrollment.findMany.mockResolvedValue([
        {
          id: 'enroll-1',
          enrolledAt: new Date(),
          trail: makeTrail({ id: 'trail-1', courses: [] }),
        },
      ]);
      prisma.enrollment.findMany.mockResolvedValue([]);
      prisma.trailCertificate.findMany.mockResolvedValue([
        { trailId: 'trail-1', verificationCode: 'SURI-TR-ABC123' },
      ]);

      const out = await controller.getMyEnrollments({ user: makeUser({ id: 'u1' }) });

      expect(out[0].certificateCode).toBe('SURI-TR-ABC123');
    });
  });

  // ─── getExamStatus ───────────────────────────────────────────────────────────

  describe('getExamStatus', () => {
    it('admin recebe ForbiddenException', async () => {
      await expect(controller.getExamStatus('trail-1', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound quando trilha não existe', async () => {
      prisma.trail.findUnique.mockResolvedValue(null);
      await expect(controller.getExamStatus('trilha-x', { user: makeUser() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('Forbidden quando não está inscrito', async () => {
      prisma.trail.findUnique.mockResolvedValue(makeTrail({ courses: [] }));
      prisma.trailEnrollment.findUnique.mockResolvedValue(null);
      await expect(controller.getExamStatus('trail-1', { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('canTakeExam=false quando cursos incompletos', async () => {
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({ courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [{ id: 'q1' }])] }),
      );
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [] }, // 0 de 1 módulo concluídos
      ]);
      prisma.quizAttempt.findMany.mockResolvedValue([]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([]);

      const out = await controller.getExamStatus('trail-1', { user: makeUser({ id: 'u1' }) });

      expect(out.canTakeExam).toBe(false);
      expect(out.allCoursesComplete).toBe(false);
    });

    it('canTakeExam=true quando todos os módulos concluídos', async () => {
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({ courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [{ id: 'q1' }])] }),
      );
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
      ]);
      prisma.quizAttempt.findMany.mockResolvedValue([]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([]);

      const out = await controller.getExamStatus('trail-1', { user: makeUser({ id: 'u1' }) });

      expect(out.allCoursesComplete).toBe(true);
      expect(out.canTakeExam).toBe(true);
      expect(out.attemptsAllowed).toBe(3);
      expect(out.blocked).toBe(false);
    });

    it('blocked=true quando tentativas esgotadas sem aprovação', async () => {
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({ courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [{ id: 'q1' }])] }),
      );
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
      ]);
      prisma.quizAttempt.findMany.mockResolvedValue([]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([
        { passed: false },
        { passed: false },
        { passed: false },
      ]);

      const out = await controller.getExamStatus('trail-1', { user: makeUser({ id: 'u1' }) });

      expect(out.attemptsUsed).toBe(3);
      expect(out.blocked).toBe(true);
      expect(out.passed).toBe(false);
    });
  });

  // ─── submitExam ──────────────────────────────────────────────────────────────

  describe('submitExam', () => {
    it('admin recebe ForbiddenException', async () => {
      await expect(controller.submitExam('trail-1', { answers: [] }, { user: makeAdmin() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando não inscrito', async () => {
      prisma.trailEnrollment.findUnique.mockResolvedValue(null);
      await expect(controller.submitExam('trail-1', { answers: [] }, { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando cursos incompletos', async () => {
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({ courses: [makeTrailCourse('c1', [makeCourseModule('m1')])] }),
      );
      prisma.enrollment.findMany.mockResolvedValue([{ courseId: 'c1', progress: [] }]);

      await expect(controller.submitExam('trail-1', { answers: [] }, { user: makeUser({ id: 'u1' }) }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('Forbidden quando tentativas esgotadas', async () => {
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({ courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [{ id: 'q1', answer: 'A' }])] }),
      );
      prisma.enrollment.findMany.mockResolvedValue([{ courseId: 'c1', progress: [{ moduleId: 'm1' }] }]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([
        { passed: false }, { passed: false }, { passed: false },
      ]);

      await expect(controller.submitExam('trail-1', { answers: [] }, { user: makeUser({ id: 'u1' }) }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('aprovação com score ≥ 70% emite certificado SURI-TR-XXX e +200 XP', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({
          courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [
            { id: 'q1', answer: 'A' },
            { id: 'q2', answer: 'B' },
          ])],
        }),
      );
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
      ]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([]);
      prisma.quizAttempt.findMany.mockResolvedValue([]);
      prisma.trailCertificate.findFirst.mockResolvedValue(null);
      prisma.trailCertificate.create.mockResolvedValue({});
      prisma.profile.update.mockResolvedValue({});
      prisma.trailQuizAttempt.create.mockResolvedValue({});

      const out = await controller.submitExam(
        'trail-1',
        { answers: [{ questionId: 'q1', selectedOption: 'A' }, { questionId: 'q2', selectedOption: 'B' }] },
        { user },
      );

      expect(out.passed).toBe(true);
      expect(out.correct).toBe(2);
      expect(out.certificateCode).toMatch(/^SURI-TR-[0-9A-F]+$/);
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { xp: { increment: 200 } } }),
      );
    });

    it('reprovação com score < 70% não emite certificado', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({
          courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [
            { id: 'q1', answer: 'A' },
            { id: 'q2', answer: 'B' },
            { id: 'q3', answer: 'C' },
          ])],
        }),
      );
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
      ]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([]);
      prisma.quizAttempt.findMany.mockResolvedValue([]);
      prisma.trailQuizAttempt.create.mockResolvedValue({});

      const out = await controller.submitExam(
        'trail-1',
        { answers: [{ questionId: 'q1', selectedOption: 'X' }] }, // todas erradas
        { user },
      );

      expect(out.passed).toBe(false);
      expect(out.certificateCode).toBeNull();
      expect(prisma.trailCertificate.create).not.toHaveBeenCalled();
    });

    it('cursos com quizzes aprovados individualmente são excluídos do exame', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({
          courses: [
            makeTrailCourse('c1', [makeCourseModule('m1')], [{ id: 'q1', answer: 'A' }]),
            makeTrailCourse('c2', [makeCourseModule('m2')], [{ id: 'q2', answer: 'B' }]),
          ],
        }),
      );
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
        { courseId: 'c2', progress: [{ moduleId: 'm2' }] },
      ]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([]);
      // c1 já foi aprovado individualmente → suas questões são excluídas
      prisma.quizAttempt.findMany.mockResolvedValue([{ courseId: 'c1' }]);
      prisma.trailCertificate.findFirst.mockResolvedValue(null);
      prisma.trailCertificate.create.mockResolvedValue({});
      prisma.profile.update.mockResolvedValue({});
      prisma.trailQuizAttempt.create.mockResolvedValue({});

      const out = await controller.submitExam(
        'trail-1',
        { answers: [{ questionId: 'q2', selectedOption: 'B' }] },
        { user },
      );

      // Apenas q2 conta — score 100%
      expect(out.total).toBe(1);
      expect(out.passed).toBe(true);
    });

    it('emite certificado automaticamente quando todos os cursos já aprovados individualmente', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({
          courses: [makeTrailCourse('c1', [makeCourseModule('m1')], [{ id: 'q1', answer: 'A' }])],
        }),
      );
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
      ]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([]);
      prisma.quizAttempt.findMany.mockResolvedValue([{ courseId: 'c1' }]); // aprovado → sem questões
      prisma.trailCertificate.findFirst.mockResolvedValue(null);
      prisma.trailCertificate.create.mockResolvedValue({});
      prisma.profile.update.mockResolvedValue({});

      const out = await controller.submitExam('trail-1', { answers: [] }, { user });

      expect(out.passed).toBe(true);
      expect(out.autoPassed).toBe(true);
      expect(out.certificateCode).toMatch(/^SURI-TR-[0-9A-F]+$/);
    });

    it('retorna certificado existente se já passou anteriormente', async () => {
      const user = makeUser({ id: 'u1' });
      prisma.trailEnrollment.findUnique.mockResolvedValue({ id: 'enroll-1' });
      prisma.trail.findUnique.mockResolvedValue(
        makeTrail({ courses: [makeTrailCourse('c1', [makeCourseModule('m1')])] }),
      );
      prisma.enrollment.findMany.mockResolvedValue([
        { courseId: 'c1', progress: [{ moduleId: 'm1' }] },
      ]);
      prisma.trailQuizAttempt.findMany.mockResolvedValue([{ passed: true }]);
      prisma.trailCertificate.findFirst.mockResolvedValue({ verificationCode: 'SURI-TR-EXIST' });

      const out = await controller.submitExam('trail-1', { answers: [] }, { user });

      expect(out.passed).toBe(true);
      expect(out.certificateCode).toBe('SURI-TR-EXIST');
      expect(prisma.trailCertificate.create).not.toHaveBeenCalled();
    });
  });

  // ─── Admin CRUD ──────────────────────────────────────────────────────────────

  describe('create (admin)', () => {
    it('rejeita não-admin', async () => {
      await expect(controller.create({ name: 'T', description: 'd' }, { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin cria trilha com defaults', async () => {
      prisma.trail.create.mockResolvedValue({ id: 'trail-new', name: 'Nova Trilha' });
      const out = await controller.create({ name: 'Nova Trilha', description: 'd' }, { user: makeAdmin() });
      expect(prisma.trail.create).toHaveBeenCalledWith({
        data: { name: 'Nova Trilha', description: 'd', targetGroup: 'all', sortOrder: 0 },
      });
      expect(out.id).toBe('trail-new');
    });
  });

  describe('update (admin)', () => {
    it('rejeita não-admin', async () => {
      await expect(controller.update('trail-1', {}, { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound quando trilha não existe', async () => {
      prisma.trail.findUnique.mockResolvedValue(null);
      await expect(controller.update('trilha-x', { name: 'X' }, { user: makeAdmin() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza apenas campos fornecidos (?? mantém antigos)', async () => {
      const existing = makeTrail({ name: 'Velho', sortOrder: 1 });
      prisma.trail.findUnique.mockResolvedValue(existing);
      prisma.trail.update.mockResolvedValue({ ...existing, name: 'Novo' });

      await controller.update('trail-1', { name: 'Novo' }, { user: makeAdmin() });

      expect(prisma.trail.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ name: 'Novo', sortOrder: 1 }),
      }));
    });
  });

  describe('remove (admin)', () => {
    it('rejeita não-admin', async () => {
      await expect(controller.remove('trail-1', { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('NotFound quando trilha não existe', async () => {
      prisma.trail.findUnique.mockResolvedValue(null);
      await expect(controller.remove('trilha-x', { user: makeAdmin() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('admin remove trilha com sucesso', async () => {
      prisma.trail.findUnique.mockResolvedValue(makeTrail());
      prisma.trail.delete.mockResolvedValue({});
      const out = await controller.remove('trail-1', { user: makeAdmin() });
      expect(out.message).toMatch(/removida/i);
      expect(prisma.trail.delete).toHaveBeenCalledWith({ where: { id: 'trail-1' } });
    });
  });

  describe('addCourse / removeCourse (admin)', () => {
    it('addCourse rejeita não-admin', async () => {
      await expect(controller.addCourse('trail-1', { courseId: 'c1' }, { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('addCourse NotFound quando trilha não existe', async () => {
      prisma.trail.findUnique.mockResolvedValue(null);
      await expect(controller.addCourse('trilha-x', { courseId: 'c1' }, { user: makeAdmin() }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('admin adiciona curso à trilha com upsert', async () => {
      prisma.trail.findUnique.mockResolvedValue(makeTrail());
      prisma.trailCourse.upsert.mockResolvedValue({ trailId: 'trail-1', courseId: 'c1' });
      const out = await controller.addCourse('trail-1', { courseId: 'c1', sortOrder: 2 }, { user: makeAdmin() });
      expect(prisma.trailCourse.upsert).toHaveBeenCalled();
      expect(out.courseId).toBe('c1');
    });

    it('removeCourse rejeita não-admin', async () => {
      await expect(controller.removeCourse('trail-1', 'c1', { user: makeUser() }))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin remove curso da trilha', async () => {
      prisma.trailCourse.deleteMany.mockResolvedValue({});
      const out = await controller.removeCourse('trail-1', 'c1', { user: makeAdmin() });
      expect(out.message).toMatch(/removido/i);
      expect(prisma.trailCourse.deleteMany).toHaveBeenCalledWith({
        where: { trailId: 'trail-1', courseId: 'c1' },
      });
    });
  });
});
