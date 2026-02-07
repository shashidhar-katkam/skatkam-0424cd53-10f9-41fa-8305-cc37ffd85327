import type { PermissionModuleDef } from './types';

/** Build all permission keys from modules (moduleId.featureId) */
export function buildAllPermissionKeys(modules: PermissionModuleDef[]): string[] {
  const keys: string[] = [];
  for (const mod of modules) {
    for (const feat of mod.features || []) {
      if (feat.featureId) {
        keys.push(`${mod.moduleId}.${feat.featureId}`);
      }
    }
  }
  return keys;
}

/** Expand defaultPermissions (supports *, module.*) to Record<string, boolean> */
export function expandPermissions(
  defaultPermissions: string[],
  allPermissionKeys: string[]
): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};

  if (defaultPermissions.includes('*')) {
    for (const k of allPermissionKeys) expanded[k] = true;
    return expanded;
  }

  for (const p of defaultPermissions) {
    if (p === '*') {
      expanded['*'] = true;
      break;
    }
    if (p.endsWith('.*')) {
      const prefix = p.slice(0, -2);
      for (const k of allPermissionKeys) {
        if (k.startsWith(prefix + '.')) expanded[k] = true;
      }
    } else {
      expanded[p] = true;
    }
  }
  return expanded;
}
