export type RoleSlug = 'owner' | 'admin' | 'viewer' | (string & {});

export interface Role {
  id: string;
  name: string;
  slug: string;
  permissions: Record<string, boolean>;
  isActive?: boolean;
}

export interface CreateRoleDto {
  name: string;
  slug: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  slug?: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}
