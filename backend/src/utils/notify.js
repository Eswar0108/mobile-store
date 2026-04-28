const prisma = require('../lib/prisma');

/**
 * Push a real-time + persisted notification to a user.
 */
const notify = async (io, { userId, message, type, link }) => {
  const notification = await prisma.notification.create({
    data: { userId, message, type, link },
  });
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
  return notification;
};

module.exports = { notify };
