import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InstructorsService } from './instructors.service';

@ApiTags('instructors')
@Controller()
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  // ── Público ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lista instrutores ativos (público, usado na landing page)' })
  @Get('instructors')
  async listPublic() {
    return this.instructorsService.listPublic();
  }

  // ── Admin CRUD ───────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lista todos os instrutores' })
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/instructors')
  async listAll(@Req() req: any) {
    return this.instructorsService.listAll(req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Cria instrutor' })
  @UseGuards(AuthGuard('jwt'))
  @Post('admin/instructors')
  async create(@Body() body: any, @Req() req: any) {
    return this.instructorsService.create(body, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza instrutor' })
  @UseGuards(AuthGuard('jwt'))
  @Put('admin/instructors/:id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.instructorsService.update(id, body, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remove instrutor' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/instructors/:id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.instructorsService.remove(id, req.user);
  }

  // ── Associação Curso ↔ Instrutor ─────────────────────────────────────────────

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Associa instrutor a curso' })
  @UseGuards(AuthGuard('jwt'))
  @Post('courses/:courseId/instructors')
  async addToCourse(
    @Param('courseId') courseId: string,
    @Body() body: { instructorId: string },
    @Req() req: any,
  ) {
    return this.instructorsService.addToCourse(courseId, body.instructorId, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remove associação instrutor-curso' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('courses/:courseId/instructors/:instructorId')
  async removeFromCourse(
    @Param('courseId') courseId: string,
    @Param('instructorId') instructorId: string,
    @Req() req: any,
  ) {
    return this.instructorsService.removeFromCourse(courseId, instructorId, req.user);
  }
}
