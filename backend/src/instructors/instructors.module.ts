import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { InstructorsService } from './instructors.service';
import { IInstructorRepository } from '../domain/repositories/instructor.repository.interface';
import { PrismaInstructorRepository } from '../infrastructure/database/repositories/prisma-instructor.repository';

@Module({
  controllers: [InstructorsController],
  providers: [
    InstructorsService,
    {
      provide: IInstructorRepository,
      useClass: PrismaInstructorRepository,
    },
  ],
  exports: [InstructorsService],
})
export class InstructorsModule {}
