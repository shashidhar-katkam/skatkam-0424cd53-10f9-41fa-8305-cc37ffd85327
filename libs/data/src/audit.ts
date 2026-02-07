export interface AuditLogEntry {
  id: string;
  accountId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
