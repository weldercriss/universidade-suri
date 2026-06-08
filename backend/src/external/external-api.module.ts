import { Module } from '@nestjs/common';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { ApiTokenStrategy } from '../infrastructure/http/strategies/api-token.strategy';

@Module({
  controllers: [ExternalApiController],
  providers: [ExternalApiService, ApiTokenStrategy],
  exports: [ExternalApiService],
})
export class ExternalApiModule {}
