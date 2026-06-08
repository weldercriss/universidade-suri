import { Module } from '@nestjs/common';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';
import { IRoadmapRepository } from '../domain/repositories/roadmap.repository.interface';
import { PrismaRoadmapRepository } from '../infrastructure/database/repositories/prisma-roadmap.repository';

@Module({
  controllers: [RoadmapsController],
  providers: [
    RoadmapsService,
    {
      provide: IRoadmapRepository,
      useClass: PrismaRoadmapRepository,
    },
  ],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
