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
import { TrailController } from './infrastructure/http/controllers/trail.controller';
import { QuizController } from './infrastructure/http/controllers/quiz.controller';
import { AdminGroupsController } from './infrastructure/http/controllers/admin-groups.controller';
import { AdminReportsController } from './infrastructure/http/controllers/admin-reports.controller';
import { SettingsController } from './infrastructure/http/controllers/settings.controller';
import { RoadmapController } from './infrastructure/http/controllers/roadmap.controller';

// Repository Implementations
import { PrismaUserRepository } from './infrastructure/database/repositories/prisma-user.repository';
import { PrismaCourseRepository } from './infrastructure/database/repositories/prisma-course.repository';
import { IUserRepository } from './domain/repositories/user.repository.interface';
import { ICourseRepository } from './domain/repositories/course.repository.interface';
import { IPostRepository } from './domain/repositories/post.repository.interface';
import { PrismaPostRepository } from './infrastructure/database/repositories/prisma-post.repository';
import { PrismaRoadmapRepository } from './infrastructure/database/repositories/prisma-roadmap.repository';
import { IRoadmapRepository } from './domain/repositories/roadmap.repository.interface';

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
    TrailController,
    QuizController,
    AdminGroupsController,
    AdminReportsController,
    SettingsController,
    RoadmapController,
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
    {
      provide: IRoadmapRepository,
      useClass: PrismaRoadmapRepository,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}
