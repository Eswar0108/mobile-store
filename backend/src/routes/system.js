const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/health
router.get('/health', asyncHandler(async (req, res) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    db: dbStatus,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
}));

module.exports = router;
