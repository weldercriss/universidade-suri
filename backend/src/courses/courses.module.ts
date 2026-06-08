import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { ICourseRepository } from '../domain/repositories/course.repository.interface';
import { PrismaCourseRepository } from '../infrastructure/database/repositories/prisma-course.repository';

@Module({
  controllers: [CoursesController],
  providers: [
    CoursesService,
    {
      provide: ICourseRepository,
      useClass: PrismaCourseRepository,
    },
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
