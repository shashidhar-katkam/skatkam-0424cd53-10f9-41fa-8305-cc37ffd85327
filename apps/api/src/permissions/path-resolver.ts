import { join } from 'path';
import { existsSync } from 'fs';

/** Resolve the permissions directory (supports dev and compiled paths) */
export function resolvePermissionsDir(): string {
  const possiblePaths = [
    __dirname,
    join(process.cwd(), 'apps/api/src/permissions'),
    join(process.cwd(), 'dist/out-tsc/apps/api/src/permissions'),
    join(process.cwd(), 'dist/apps/api/src/permissions'),
  ];
  for (const p of possiblePaths) {
    const metadataPath = join(p, 'metadata.json');
    if (existsSync(metadataPath)) return p;
  }
  return __dirname;
}
