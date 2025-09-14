// controllers/authController.js - Controlador de autenticación
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');

// Registro de usuario
const register = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            correo,
            contrasena,
            facultad,
            telefono,
            edificio_habitual,
            carrera,
            semestre,
            cedula
        } = req.body;
        
        // Validaciones básicas
        if (!nombre || !apellido || !correo || !contrasena) {
            return res.status(400).json({
                error: 'Datos requeridos',
                message: 'Nombre, apellido, correo y contraseña son obligatorios'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                error: 'Email inválido',
                message: 'El formato del correo electrónico no es válido'
            });
        }
        
        // Validar que sea correo de UTP (opcional)
        if (!correo.endsWith('@utp.ac.pa')) {
            return res.status(400).json({
                error: 'Email institucional requerido',
                message: 'Debes usar tu correo institucional @utp.ac.pa'
            });
        }
        
        // Validar contraseña
        if (contrasena.length < 6) {
            return res.status(400).json({
                error: 'Contraseña débil',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // Verificar si el usuario ya existe
        const existingUser = await executeQuery(
            'SELECT id_usuario FROM Usuarios WHERE correo = ?',
            [correo]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Usuario ya existe',
                message: 'Ya existe un usuario registrado con este correo electrónico'
            });
        }
        
        // Encriptar contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        
        // Crear usuario
        const result = await executeQuery(
            `INSERT INTO Usuarios (
                nombre, apellido, correo, contrasena, facultad, telefono, 
                edificio_habitual, carrera, semestre, cedula, activo, fecha_registro
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
            [nombre, apellido, correo, hashedPassword, facultad, telefono, 
             edificio_habitual, carrera, semestre, cedula]
        );
        
        const userId = result.insertId;
        
        // Generar tokens
        const tokens = generateTokens(userId);
        
        // Obtener datos del usuario creado
        const newUser = await executeQuery(
            `SELECT id_usuario, nombre, apellido, correo, facultad, telefono,
                    edificio_habitual, carrera, semestre, cedula, activo, fecha_registro
             FROM Usuarios WHERE id_usuario = ?`,
            [userId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            data: {
                user: newUser[0],
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_EXPIRE || '24h'
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error creando el usuario'
        });
    }
};

// Inicio de sesión
const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        
        // Validaciones básicas
        if (!correo || !contrasena) {
            return res.status(400).json({
                error: 'Datos requeridos',
                message: 'Correo y contraseña son obligatorios'
            });
        }
        
        // Buscar usuario por correo
        const user = await executeQuery(
            `SELECT id_usuario, nombre, apellido, correo, contrasena, facultad, 
                    telefono, edificio_habitual, carrera, semestre, cedula, activo
             FROM Usuarios WHERE correo = ?`,
            [correo]
        );
        
        if (user.length === 0) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Correo o contraseña incorrectos'
            });
        }
        
        const userData = user[0];
        
        // Verificar si el usuario está activo
        if (!userData.activo) {
            return res.status(401).json({
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta al administrador'
            });
        }
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(contrasena, userData.contrasena);
        
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Correo o contraseña incorrectos'
            });
        }
        
        // Generar tokens
        const tokens = generateTokens(userData.id_usuario);
        
        // Actualizar última actividad del usuario
        await executeQuery(
            'UPDATE Usuarios SET ultima_actividad = NOW() WHERE id_usuario = ?',
            [userData.id_usuario]
        );
        
        // Eliminar contraseña de la respuesta
        delete userData.contrasena;
        
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: userData,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_EXPIRE || '24h'
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error iniciando sesión'
        });
    }
};

// Renovar token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                error: 'Refresh token requerido',
                message: 'El token de renovación es obligatorio'
            });
        }
        
        try {
            // Verificar refresh token
            const decoded = verifyRefreshToken(refreshToken);
            
            // Verificar que el usuario existe
            const user = await executeQuery(
                'SELECT id_usuario, activo FROM Usuarios WHERE id_usuario = ?',
                [decoded.id]
            );
            
            if (user.length === 0 || !user[0].activo) {
                return res.status(401).json({
                    error: 'Usuario inválido',
                    message: 'El usuario no existe o está inactivo'
                });
            }
            
            // Generar nuevos tokens
            const tokens = generateTokens(decoded.id);
            
            res.json({
                success: true,
                message: 'Token renovado correctamente',
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    tokenType: 'Bearer',
                    expiresIn: process.env.JWT_EXPIRE || '24h'
                }
            });
            
        } catch (tokenError) {
            return res.status(401).json({
                error: 'Refresh token inválido',
                message: 'El token de renovación no es válido o ha expirado'
            });
        }
        
    } catch (error) {
        console.error('Error renovando token:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error renovando el token'
        });
    }
};

// Cerrar sesión
const logout = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // En una implementación real, aquí podrías:
        // 1. Blacklistar el token
        // 2. Eliminar refresh tokens de la base de datos
        // 3. Limpiar sesiones activas
        
        // Por simplicidad, solo actualizamos la última actividad
        await executeQuery(
            'UPDATE Usuarios SET ultima_actividad = NOW() WHERE id_usuario = ?',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
        
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error cerrando sesión'
        });
    }
};

// Verificar token (middleware endpoint)
const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el middleware de auth ya validó el token
        const userId = req.user.id;
        
        const user = await executeQuery(
            `SELECT id_usuario, nombre, apellido, correo, facultad, telefono,
                    edificio_habitual, carrera, semestre, cedula, activo, fecha_registro
             FROM Usuarios WHERE id_usuario = ?`,
            [userId]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: user[0]
            }
        });
        
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error verificando el token'
        });
    }
};

// Solicitar recuperación de contraseña
const forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;
        
        if (!correo) {
            return res.status(400).json({
                error: 'Correo requerido',
                message: 'El correo electrónico es obligatorio'
            });
        }
        
        // Verificar si el usuario existe
        const user = await executeQuery(
            'SELECT id_usuario, nombre, correo FROM Usuarios WHERE correo = ? AND activo = TRUE',
            [correo]
        );
        
        if (user.length === 0) {
            // Por seguridad, no revelamos si el email existe o no
            return res.json({
                success: true,
                message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'
            });
        }
        
        // Generar token de recuperación (simple implementación)
        const resetToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        
        // En una implementación real, guardarías este token en la BD con expiración
        // y enviarías un email con el enlace de recuperación
        
        console.log(`Token de recuperación para ${correo}: ${resetToken}`);
        
        res.json({
            success: true,
            message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
            // En desarrollo, incluir el token para testing
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });
        
    } catch (error) {
        console.error('Error en forgot password:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error procesando la solicitud'
        });
    }
};

// Cambiar contraseña con token de recuperación
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, correo } = req.body;
        
        if (!token || !newPassword || !correo) {
            return res.status(400).json({
                error: 'Datos requeridos',
                message: 'Token, nueva contraseña y correo son obligatorios'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Contraseña débil',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        // En una implementación real, verificarías el token desde la BD
        // Por ahora, simulamos validación básica
        
        // Verificar usuario
        const user = await executeQuery(
            'SELECT id_usuario FROM Usuarios WHERE correo = ? AND activo = TRUE',
            [correo]
        );
        
        if (user.length === 0) {
            return res.status(400).json({
                error: 'Token inválido',
                message: 'El token de recuperación no es válido'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar contraseña
        await executeQuery(
            'UPDATE Usuarios SET contrasena = ? WHERE correo = ?',
            [hashedPassword, correo]
        );
        
        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
        
    } catch (error) {
        console.error('Error en reset password:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error actualizando la contraseña'
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    verifyToken,
    forgotPassword,
    resetPassword
};