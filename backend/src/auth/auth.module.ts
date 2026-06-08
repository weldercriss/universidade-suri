import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IUserRepository } from '../domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../infrastructure/database/repositories/prisma-user.repository';
import { JwtStrategy } from '../infrastructure/http/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'suri_super_secret_key_123!',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: IUserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [AuthService, IUserRepository, PassportModule, JwtModule],
})
export class AuthModule {}
