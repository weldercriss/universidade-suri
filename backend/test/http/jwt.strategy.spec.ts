import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../../src/infrastructure/http/strategies/jwt.strategy';
import { buildUserRepoMock, makeUser } from '../helpers/mocks';

describe('JwtStrategy', () => {
  let userRepo: ReturnType<typeof buildUserRepoMock>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    userRepo = buildUserRepoMock();
    strategy = new JwtStrategy(userRepo as any);
  });

  it('retorna o usuário quando o sub do payload existe', async () => {
    const u = makeUser({ id: 'u1', email: 'aluno@suri.com' });
    userRepo.findById.mockResolvedValue(u);
    const out = await strategy.validate({ sub: 'u1', email: 'aluno@suri.com' });
    expect(out).toBe(u);
    expect(userRepo.findById).toHaveBeenCalledWith('u1');
  });

  it('lança Unauthorized quando o usuário não existe', async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'inexistente', email: 'x@x.com' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });
});
