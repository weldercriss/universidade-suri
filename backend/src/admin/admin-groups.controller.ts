import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGroupsService } from './admin-groups.service';

@Controller('admin/groups')
export class AdminGroupsController {
  constructor(private readonly adminGroupsService: AdminGroupsService) {}

  // ─── Regras de grupo ────────────────────────────────────────────────────────

  @Get('rules')
  @UseGuards(AuthGuard('jwt'))
  async listRules(@Req() req: any) {
    return this.adminGroupsService.listRules(req.user);
  }

  @Post('rules')
  @UseGuards(AuthGuard('jwt'))
  async createRule(@Req() req: any, @Body() body: any) {
    return this.adminGroupsService.createRule(req.user, body);
  }

  @Put('rules/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateRule(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.adminGroupsService.updateRule(req.user, id, body);
  }

  @Delete('rules/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteRule(@Req() req: any, @Param('id') id: string) {
    return this.adminGroupsService.deleteRule(req.user, id);
  }

  // ─── Listar usuários com filtros de grupo/tier ──────────────────────────────

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async listGroupUsers(
    @Req() req: any,
    @Query('groupType') groupType?: string,
    @Query('tier') tier?: string,
  ) {
    return this.adminGroupsService.listGroupUsers(req.user, groupType, tier);
  }

  // ─── Distribuição de usuários por grupo/subgrupo ────────────────────────────

  @Get('distribution')
  @UseGuards(AuthGuard('jwt'))
  async getDistribution(@Req() req: any) {
    return this.adminGroupsService.getDistribution(req.user);
  }
}
