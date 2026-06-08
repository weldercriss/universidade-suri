import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { ICourseRepository } from '../domain/repositories/course.repository.interface';
import { PrismaCourseRepository } from '../infrastructure/database/repositories/prisma-course.repository';

@Module({
  controllers: [QuizController],
  providers: [
    QuizService,
    {
      provide: ICourseRepository,
      useClass: PrismaCourseRepository,
    },
  ],
  exports: [QuizService],
})
export class QuizModule {}
