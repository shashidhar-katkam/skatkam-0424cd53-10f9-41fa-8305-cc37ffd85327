export interface PermissionFeatureDef {
  featureId: string;
  featureName: string;
  description?: string;
  defaultEnabled?: boolean;
}

export interface PermissionModuleDef {
  moduleId: string;
  moduleName: string;
  description?: string;
  features: PermissionFeatureDef[];
}

export interface SystemRoleDef {
  roleId: string;
  roleName?: string;
  description?: string;
  defaultPermissions?: string[];
}

export interface SyncPermissionsResponseDto {
  success: boolean;
  message: string;
  stats: {
    modulesCreated: number;
    modulesUpdated: number;
    featuresCreated: number;
    featuresUpdated: number;
    totalModules: number;
    totalFeatures: number;
  };
  version?: string;
}
