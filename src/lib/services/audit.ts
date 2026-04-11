import { db } from '../db/db';
import { logger } from '../db/logger';

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

export async function createAuditLog(entry: AuditLogEntry, organizationId: string) {
  logger.info({
    level: 'info',
    msg: 'audit_log',
    action: entry.action,
    entityType: entry.entityType,
    userId: entry.userId,
    entityId: entry.entityId
  }, 'audit_log');

  // Build oldData/newData from changes if provided
  let oldData: string | undefined;
  let newData: string | undefined;
  if (entry.changes) {
    const oldObj: Record<string, unknown> = {};
    const newObj: Record<string, unknown> = {};
    for (const [key, change] of Object.entries(entry.changes)) {
      oldObj[key] = change.old;
      newObj[key] = change.new;
    }
    oldData = JSON.stringify(oldObj);
    newData = JSON.stringify(newObj);
  }

  return db.auditLog.create({
    data: {
      organizationId,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      description: entry.action + ' on ' + entry.entityType,
      oldData,
      newData,
      ipAddress: entry.ip,
      userAgent: entry.userAgent,
    },
  });
}
