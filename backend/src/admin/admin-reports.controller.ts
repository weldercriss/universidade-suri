import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminReportsService } from './admin-reports.service';

@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getReports(
    @Req() req: any,
    @Query('courseId') courseId?: string,
    @Query('trailId') trailId?: string,
    @Query('groupType') groupType?: string,
    @Query('tier') tier?: string,
    @Query('level') level?: string,
    @Query('company') company?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminReportsService.getReports(req.user, {
      courseId, trailId, groupType, tier, level, company, dateFrom, dateTo,
    });
  }
}
