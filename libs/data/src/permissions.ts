export interface PermissionFeatureStructure {
  featureId: string;
  featureName: string;
  description: string | null;
  defaultEnabled: boolean;
  permissionKey: string;
}

export interface PermissionModuleStructure {
  moduleId: string;
  moduleName: string;
  description: string | null;
  sortOrder: number;
  features: PermissionFeatureStructure[];
}

export type PermissionStructure = PermissionModuleStructure[];
