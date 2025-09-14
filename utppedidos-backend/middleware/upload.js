// ===== middleware/upload.js =====
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH || './public/uploads/');
    },
    filename: function (req, file, cb) {
        // Generar nombre único
        const uniqueName = uuidv4() + '-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB por defecto
        files: 5 // Máximo 5 archivos
    },
    fileFilter: fileFilter
});

// Middleware para manejar errores de upload
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Archivo demasiado grande',
                message: 'El archivo excede el tamaño máximo permitido'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Demasiados archivos',
                message: 'Se excedió el número máximo de archivos permitidos'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Campo de archivo inesperado',
                message: 'El campo del archivo no es válido'
            });
        }
    }
    
    if (err.message === 'Tipo de archivo no permitido') {
        return res.status(400).json({
            success: false,
            error: 'Tipo de archivo no permitido',
            message: 'Solo se permiten imágenes (JPEG, PNG, WebP)'
        });
    }
    
    next(err);
};

module.exports = {
    upload,
    handleUploadErrors
};
