import { User } from '../../src/domain/entities/user.entity';

describe('User entity', () => {
  const baseArgs = (overrides: Partial<{
    isAdmin: boolean; xp: number; level: number;
  }> = {}) => new User(
    'u1',
    'Aluno',
    'aluno@suri.com',
    'hash',
    'embaixador',
    'Embaixador Voice',
    overrides.xp ?? 0,
    overrides.level ?? 1,
    overrides.isAdmin ?? false,
    new Date('2026-01-01T00:00:00Z'),
    true,
    null,
  );

  it('constrói com defaults isActive=true e profileImage=null', () => {
    const u = new User('id', 'n', 'e@e', 'h', 'vip', 'VIP PLUS', 0, 1, false, new Date());
    expect(u.isActive).toBe(true);
    expect(u.profileImage).toBeNull();
  });

  describe('addXp', () => {
    it('soma XP para usuário comum', () => {
      const u = baseArgs();
      u.addXp(100);
      expect(u.xp).toBe(100);
      expect(u.level).toBe(1);
    });

    it('não altera XP/level de admin', () => {
      const u = baseArgs({ isAdmin: true, xp: 500, level: 1 });
      u.addXp(5000);
      expect(u.xp).toBe(500);
      expect(u.level).toBe(1);
    });

    it('sobe de nível ao cruzar 1000 XP', () => {
      const u = baseArgs({ xp: 950 });
      u.addXp(100); // total 1050 -> level 2
      expect(u.xp).toBe(1050);
      expect(u.level).toBe(2);
    });

    it('vai para nível 3 ao cruzar 2000', () => {
      const u = baseArgs({ xp: 1900 });
      u.addXp(150); // 2050 -> level 3
      expect(u.xp).toBe(2050);
      expect(u.level).toBe(3);
    });

    it('mantém o nível mais alto se total recuar (não regride)', () => {
      const u = baseArgs({ xp: 0, level: 5 });
      u.addXp(100);
      // newLevel = floor(100/1000)+1 = 1; mas level (5) é maior, não pode descer
      expect(u.level).toBe(5);
      expect(u.xp).toBe(100);
    });

    it('aceita XP zero sem alterar estado', () => {
      const u = baseArgs({ xp: 200, level: 1 });
      u.addXp(0);
      expect(u.xp).toBe(200);
      expect(u.level).toBe(1);
    });
  });
});
