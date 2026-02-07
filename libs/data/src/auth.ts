export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  organizationName: string;
  email: string;
  password: string;
  name?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
  organizationName?: string;
  role: string;
  roleId?: string;
  roleName?: string;
  permissions?: Record<string, boolean>;
  /** True when user belongs to the super organization (e.g. can access Swagger). */
  canAccessSwagger?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface MeResponse {
  user: SessionUser;
}
