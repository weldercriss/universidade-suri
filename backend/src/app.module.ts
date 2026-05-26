import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from './infrastructure/database/prisma.service';

// Controllers
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { CourseController } from './infrastructure/http/controllers/course.controller';
import { EnrollmentController } from './infrastructure/http/controllers/enrollment.controller';
import { CertificateController } from './infrastructure/http/controllers/certificate.controller';
import { PostController } from './infrastructure/http/controllers/post.controller';

// Repository Implementations
import { PrismaUserRepository } from './infrastructure/database/repositories/prisma-user.repository';
import { PrismaCourseRepository } from './infrastructure/database/repositories/prisma-course.repository';
import { IUserRepository } from './domain/repositories/user.repository.interface';
import { ICourseRepository } from './domain/repositories/course.repository.interface';
import { IPostRepository } from './domain/repositories/post.repository.interface';
import { PrismaPostRepository } from './infrastructure/database/repositories/prisma-post.repository';

// Strategies & Guards
import { JwtStrategy } from './infrastructure/http/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'suri_super_secret_key_123!',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AuthController,
    CourseController,
    EnrollmentController,
    CertificateController,
    PostController,
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    {
      provide: IUserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: ICourseRepository,
      useClass: PrismaCourseRepository,
    },
    {
      provide: IPostRepository,
      useClass: PrismaPostRepository,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
