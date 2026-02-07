import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../shared';

const startTime = Date.now();

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check (no auth)' })
  async check() {
    const db = await this.dbStatus();
    const healthy = db === 'up';
    return {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      db,
    };
  }

  private async dbStatus(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
