// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log del error
    console.error('Error Stack:', err.stack);

    // Error de sintaxis SQL
    if (err.code === 'ER_PARSE_ERROR') {
        const message = 'Error de sintaxis en la consulta';
        error = { message, statusCode: 400 };
    }

    // Error de conexión de base de datos
    if (err.code === 'ECONNREFUSED') {
        const message = 'Error de conexión a la base de datos';
        error = { message, statusCode: 500 };
    }

    // Error de usuario duplicado
    if (err.code === 'ER_DUP_ENTRY') {
        let message = 'Datos duplicados';
        if (err.sqlMessage.includes('correo')) {
            message = 'El correo electrónico ya está registrado';
        }
        error = { message, statusCode: 409 };
    }

    // Error de clave foránea
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = 'Referencia inválida a registro inexistente';
        error = { message, statusCode: 400 };
    }

    // Error de tabla no encontrada
    if (err.code === 'ER_NO_SUCH_TABLE') {
        const message = 'Tabla de base de datos no encontrada';
        error = { message, statusCode: 500 };
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token de acceso inválido';
        error = { message, statusCode: 401 };
    }

    // Error de JWT expirado
    if (err.name === 'TokenExpiredError') {
        const message = 'Token de acceso expirado';
        error = { message, statusCode: 401 };
    }

    // Error de validación
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // Error de cast (tipo de dato incorrecto)
    if (err.name === 'CastError') {
        const message = 'Formato de ID inválido';
        error = { message, statusCode: 400 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
