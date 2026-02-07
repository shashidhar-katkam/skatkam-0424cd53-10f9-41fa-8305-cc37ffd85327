/** JWT payload from authenticated requests */
export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}
