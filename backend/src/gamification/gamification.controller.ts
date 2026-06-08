import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GamificationService } from './gamification.service';
import { CreateXpRuleDto, UpdateXpRuleDto } from './gamification.dto';

@Controller()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('gamification/rules')
  @UseGuards(AuthGuard('jwt'))
  async getRules() {
    return this.gamificationService.getRules();
  }

  @Post('admin/gamification/rules')
  @UseGuards(AuthGuard('jwt'))
  async createRule(@Req() req: any, @Body() dto: CreateXpRuleDto) {
    return this.gamificationService.createRule(req.user, dto);
  }

  @Put('admin/gamification/rules/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateRule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateXpRuleDto,
  ) {
    return this.gamificationService.updateRule(req.user, id, dto);
  }

  @Delete('admin/gamification/rules/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(@Req() req: any, @Param('id') id: string) {
    return this.gamificationService.deleteRule(req.user, id);
  }
}
