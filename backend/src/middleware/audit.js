const prisma = require('../lib/prisma');

/**
 * Creates an audit log entry for admin actions.
 */
const auditLog = async ({ adminId, action, entityType, entityId, beforeState, afterState, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: String(entityId),
        beforeState: beforeState || undefined,
        afterState: afterState || undefined,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { auditLog };
