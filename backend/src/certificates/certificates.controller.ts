import { Controller, Post, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gera certificado automático de curso após 100% concluído e prova aprovada' })
  @ApiResponse({ status: 201, description: 'Certificado gerado — código UNISURI-XXXXXX' })
  @ApiResponse({ status: 403, description: 'Curso incompleto, sem matrícula ou prova não aprovada' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @Post(':courseId/generate')
  @UseGuards(AuthGuard('jwt'))
  async generate(@Param('courseId') courseId: string, @Req() req: any) {
    return this.certificatesService.generate(courseId, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Emite certificado manual para um aluno — código UNISURI-MAN-XXXXXX' })
  @ApiResponse({ status: 201, description: 'Certificado emitido manualmente' })
  @ApiResponse({ status: 403, description: 'Apenas administradores' })
  @ApiResponse({ status: 404, description: 'Curso não encontrado' })
  @Post(':courseId/issue-manual/:targetUserId')
  @UseGuards(AuthGuard('jwt'))
  async issueManual(@Param('courseId') courseId: string, @Param('targetUserId') targetUserId: string, @Req() req: any) {
    return this.certificatesService.issueManual(courseId, targetUserId, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os certificados do usuário autenticado (cursos + trilhas)' })
  @ApiResponse({ status: 200, description: '{ count, certificates[] } — inclui isTrailCertificate' })
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getUserCertificates(@Req() req: any) {
    return this.certificatesService.getUserCertificates(req.user);
  }

  @ApiOperation({ summary: 'Validação pública de certificado por código (sem autenticação) — suporta cursos e trilhas' })
  @ApiResponse({ status: 200, description: 'Certificado válido — retorna dados do aluno e curso/trilha' })
  @ApiResponse({ status: 404, description: 'Código não encontrado' })
  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    return this.certificatesService.validate(code);
  }
}
