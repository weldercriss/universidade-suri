import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { GamificationService } from '../../src/gamification/gamification.service';
import { buildPrismaMock, makeAdmin, makeUser } from '../helpers/mocks';

describe('GamificationService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let service: GamificationService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    (prisma as any).groupRule = { findMany: jest.fn().mockResolvedValue([]) };
    (prisma as any).xpRule.findMany = jest.fn().mockResolvedValue([]);
    (prisma as any).xpRule.create = jest.fn();
    (prisma as any).xpRule.update = jest.fn();
    (prisma as any).xpRule.delete = jest.fn();
    service = new GamificationService(prisma as any);
  });

  describe('getRules', () => {
    it('retorna xpRules ativas e groupRules', async () => {
      (prisma as any).xpRule.findMany.mockResolvedValue([{ action: 'post' }]);
      (prisma as any).groupRule.findMany.mockResolvedValue([{ groupType: 'vip' }]);
      const out = await service.getRules();
      expect(out.xpRules).toHaveLength(1);
      expect(out.groupRules).toHaveLength(1);
    });
  });

  describe('createRule', () => {
    it('rejeita não-admin', async () => {
      await expect(service.createRule(makeUser(), { action: 'x', label: 'X', xpValue: 5 } as any))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita identificador duplicado', async () => {
      prisma.xpRule.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(service.createRule(makeAdmin(), { action: 'post', label: 'P', xpValue: 5 } as any))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('admin cria regra com icon default Zap', async () => {
      prisma.xpRule.findUnique.mockResolvedValue(null);
      (prisma as any).xpRule.create.mockImplementation(async ({ data }: any) => data);
      const out = await service.createRule(makeAdmin(), { action: 'novo', label: 'Novo', xpValue: 5 } as any);
      expect(out.icon).toBe('Zap');
    });
  });

  describe('updateRule / deleteRule', () => {
    it('updateRule NotFound se regra inexistente', async () => {
      prisma.xpRule.findUnique.mockResolvedValue(null);
      await expect(service.updateRule(makeAdmin(), 'r1', { xpValue: 10 } as any))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('deleteRule rejeita não-admin', async () => {
      await expect(service.deleteRule(makeUser(), 'r1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('deleteRule remove quando existe', async () => {
      prisma.xpRule.findUnique.mockResolvedValue({ id: 'r1' });
      await service.deleteRule(makeAdmin(), 'r1');
      expect((prisma as any).xpRule.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });
});
