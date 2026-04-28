module.exports = {
  apps: [
    {
      name: 'mobilestore-api',
      script: 'src/app.js',
      cwd: '/var/www/mobile-store/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/pm2/mobilestore-error.log',
      out_file: '/var/log/pm2/mobilestore-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
