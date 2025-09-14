// ===== middleware/compression.js =====
const compression = require('compression');

const compressionMiddleware = compression({
  level: 6, // Nivel de compresión (0-9)
  threshold: 1024, // Solo comprimir respuestas >= 1kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

module.exports = compressionMiddleware;
