export interface User {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
  roleId: string;
  role?: RoleInfo;
}

export interface RoleInfo {
  id: string;
  name: string;
  slug: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  roleId: string;
  organizationId?: string;
}

export interface UpdateUserDto {
  name?: string;
  roleId?: string;
  password?: string;
}
