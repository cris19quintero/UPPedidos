// ===== utils/logger.js =====
const colors = require('colors');

class Logger {
  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`.cyan, data ? data : '');
  }
  
  static success(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SUCCESS: ${message}`.green, data ? data : '');
  }
  
  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] WARN: ${message}`.yellow, data ? data : '');
  }
  
  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`.red);
    if (error) {
      console.error(error);
    }
  }
  
  static debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] DEBUG: ${message}`.magenta, data ? data : '');
    }
  }
  
  static http(method, url, statusCode, responseTime) {
    const color = statusCode >= 400 ? 'red' : statusCode >= 300 ? 'yellow' : 'green';
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${url} ${statusCode} - ${responseTime}ms`[color]);
  }
}

module.exports = Logger;