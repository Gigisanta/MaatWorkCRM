import { db } from './db';

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'permission_change';

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  // Console logging for debugging
  console.log(JSON.stringify({
    level: 'info',
    msg: 'audit_log',
    action: entry.action,
    entityType: entry.entityType,
    userId: entry.userId,
    entityId: entry.entityId
  }))

  return db.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes ? JSON.stringify(entry.changes) : undefined,
      ipAddress: entry.ip,
      userAgent: entry.userAgent,
    },
  });
}
