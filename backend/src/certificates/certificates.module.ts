import { Module } from '@nestjs/common';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { ICourseRepository } from '../domain/repositories/course.repository.interface';
import { PrismaCourseRepository } from '../infrastructure/database/repositories/prisma-course.repository';

@Module({
  controllers: [CertificatesController],
  providers: [
    CertificatesService,
    {
      provide: ICourseRepository,
      useClass: PrismaCourseRepository,
    },
  ],
  exports: [CertificatesService],
})
export class CertificatesModule {}
