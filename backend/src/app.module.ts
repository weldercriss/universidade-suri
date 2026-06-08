import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Global Infrastructure Modules
import { PrismaModule } from './infrastructure/database/prisma.module';
import { StorageModule } from './infrastructure/storage/storage.module';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PostsModule } from './posts/posts.module';
import { TrailsModule } from './trails/trails.module';
import { QuizModule } from './quiz/quiz.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';
import { SettingsModule } from './settings/settings.module';
import { GamificationModule } from './gamification/gamification.module';
import { InstructorsModule } from './instructors/instructors.module';
import { ExternalApiModule } from './external/external-api.module';
import { ChangelogModule } from './changelog/changelog.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    StorageModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    CertificatesModule,
    PostsModule,
    TrailsModule,
    QuizModule,
    RoadmapsModule,
    SettingsModule,
    GamificationModule,
    InstructorsModule,
    ExternalApiModule,
    ChangelogModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
