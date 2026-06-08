import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateApiTokenDto } from '../infrastructure/http/dtos/api-token.dto';
import { AdminApiTokenService } from './admin-api-token.service';

@ApiTags('admin-api-tokens')
@ApiBearerAuth()
@Controller('admin/api-tokens')
@UseGuards(AuthGuard('jwt'))
export class AdminApiTokenController {
  constructor(private readonly adminApiTokenService: AdminApiTokenService) {}

  @Get()
  async listTokens(@Req() req: any) {
    return this.adminApiTokenService.listTokens(req.user);
  }

  @Post()
  async createToken(@Req() req: any, @Body() body: CreateApiTokenDto) {
    return this.adminApiTokenService.createToken(req.user, body);
  }

  @Patch(':id/toggle')
  async toggleToken(@Req() req: any, @Param('id') id: string) {
    return this.adminApiTokenService.toggleToken(req.user, id);
  }

  @Delete(':id')
  async deleteToken(@Req() req: any, @Param('id') id: string) {
    return this.adminApiTokenService.deleteToken(req.user, id);
  }
}
