import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface ChangeEntry {
  type: 'new' | 'improved' | 'fixed';
  text: string;
}

export interface Release {
  version: string;
  date: string;
  title: string;
  changes: ChangeEntry[];
}

@Injectable()
export class ChangelogService {
  getChangelog(): Release[] {
    const dir = path.join(process.cwd(), 'data', 'changelog');
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const releases: Release[] = files.map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      return JSON.parse(raw) as Release;
    });

    return releases.sort((a, b) =>
      b.version.localeCompare(a.version, undefined, { numeric: true })
    );
  }
}
