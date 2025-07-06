// middleware/logger.js
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston logger config
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'requests.log') })
  ]
});

// Express middleware
const logRequests = (req, res, next) => {
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      user: req.user ? req.user.id : 'Guest',
      timestamp: new Date().toISOString()
    });
  });
  next();
};

module.exports = logRequests;
