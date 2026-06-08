import { Controller, Get } from '@nestjs/common';
import { ChangelogService, Release } from './changelog.service';

@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Get()
  getChangelog(): Release[] {
    return this.changelogService.getChangelog();
  }
}
