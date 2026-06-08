import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { CoursesService } from './courses.service';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({ summary: 'Preview público de cursos (sem autenticação, usado na landing page)' })
  @ApiResponse({ status: 200, description: 'Lista resumida de cursos publicados' })
  @Get('public')
  async listPublicPreview() {
    return this.coursesService.listPublicPreview();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista cursos — admin vê todos, aluno vê apenas publicados do seu grupo' })
  @ApiResponse({ status: 200, description: 'Array de cursos' })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async listAll(@Req() req: any) {
    return this.coursesService.listAll(req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhes de um curso com suas aulas' })
  @ApiResponse({ status: 200, description: 'Curso encontrado' })
  @ApiResponse({ status: 403, description: 'Acesso restrito ao grupo do curso' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getDetails(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.getDetails(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Cria um novo curso' })
  @ApiResponse({ status: 201, description: 'Curso criado' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.coursesService.create(body, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza dados de um curso' })
  @ApiResponse({ status: 200, description: 'Curso atualizado' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.coursesService.update(id, body, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remove um curso' })
  @ApiResponse({ status: 200, description: 'Curso removido' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.delete(id, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Adiciona uma aula ao curso' })
  @ApiResponse({ status: 201, description: 'Aula criada' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/lessons')
  async createLesson(@Param('id') courseId: string, @Body() body: any, @Req() req: any) {
    return this.coursesService.createLesson(courseId, body, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Atualiza uma aula' })
  @ApiResponse({ status: 200, description: 'Aula atualizada' })
  @ApiResponse({ status: 404, description: 'Aula não encontrada' })
  @UseGuards(AuthGuard('jwt'))
  @Put('lessons/:lessonId')
  async updateLesson(@Param('lessonId') lessonId: string, @Body() body: any, @Req() req: any) {
    return this.coursesService.updateLesson(lessonId, body, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Remove uma aula' })
  @ApiResponse({ status: 200, description: 'Aula removida' })
  @UseGuards(AuthGuard('jwt'))
  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string, @Req() req: any) {
    return this.coursesService.deleteLesson(lessonId, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Upload de imagem de capa do curso (JPG/PNG/WEBP, máx 5MB)' })
  @ApiResponse({ status: 201, description: 'Capa atualizada, retorna coverUrl' })
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('cover', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Formato não suportado. Use JPG, PNG ou WEBP.'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadCover(@Param('id') id: string, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.coursesService.uploadCover(id, file, req.user);
  }
}
