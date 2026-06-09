import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { InstructorsService } from './instructors.service';
import { IInstructorRepository } from '../domain/repositories/instructor.repository.interface';
import { PrismaInstructorRepository } from '../infrastructure/database/repositories/prisma-instructor.repository';
import { SupabaseStorageService } from '../infrastructure/storage/supabase-storage.service';

@Module({
  controllers: [InstructorsController],
  providers: [
    InstructorsService,
    SupabaseStorageService,
    {
      provide: IInstructorRepository,
      useClass: PrismaInstructorRepository,
    },
  ],
  exports: [InstructorsService],
})
export class InstructorsModule {}
