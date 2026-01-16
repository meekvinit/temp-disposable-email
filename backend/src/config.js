require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',

  // SMTP
  SMTP_PORT: process.env.SMTP_PORT || 2525,
  SMTP_BIND_ADDR: process.env.SMTP_BIND_ADDR || '0.0.0.0',
  EMAIL_DOMAIN: process.env.EMAIL_DOMAIN || 'develo.in',

  // Storage
  DB_PATH: process.env.DB_PATH || 'emails.db',

  // Security
  // Basic rate limiting or auth keys can be added here

  // Auto-cleanup
  EMAIL_RETENTION_MINUTES: process.env.EMAIL_RETENTION_MINUTES || 60,
};
