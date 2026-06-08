import { Module } from '@nestjs/common';
import { AdminGroupsController } from './admin-groups.controller';
import { AdminGroupsService } from './admin-groups.service';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminApiTokenController } from './admin-api-token.controller';
import { AdminApiTokenService } from './admin-api-token.service';

@Module({
  controllers: [
    AdminGroupsController,
    AdminReportsController,
    AdminApiTokenController,
  ],
  providers: [
    AdminGroupsService,
    AdminReportsService,
    AdminApiTokenService,
  ],
  exports: [
    AdminGroupsService,
    AdminReportsService,
    AdminApiTokenService,
  ],
})
export class AdminModule {}
