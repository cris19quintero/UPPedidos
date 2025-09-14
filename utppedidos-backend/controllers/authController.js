// ===== controllers/authController.js - Controlador de autenticación Firebase =====
const bcrypt = require('bcryptjs');
const { getDB, generateId, serverTimestamp } = require('../config/database');
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
                success: false,
                error: 'Datos requeridos',
                message: 'Nombre, apellido, correo y contraseña son obligatorios'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido',
                message: 'El formato del correo electrónico no es válido'
            });
        }
        
        // Validar que sea correo de UTP
        if (!correo.endsWith('@utp.ac.pa')) {
            return res.status(400).json({
                success: false,
                error: 'Email institucional requerido',
                message: 'Debes usar tu correo institucional @utp.ac.pa'
            });
        }
        
        // Validar contraseña
        if (contrasena.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña débil',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        const db = getDB();
        
        // Verificar si el usuario ya existe
        const existingUserQuery = await db.collection('usuarios')
            .where('correo', '==', correo)
            .get();
        
        if (!existingUserQuery.empty) {
            return res.status(409).json({
                success: false,
                error: 'Usuario ya existe',
                message: 'Ya existe un usuario registrado con este correo electrónico'
            });
        }
        
        // Encriptar contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        
        // Generar ID único para el usuario
        const userId = generateId();
        
        // Crear datos del usuario
        const userData = {
            id_usuario: userId,
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            correo: correo.toLowerCase().trim(),
            contrasena: hashedPassword,
            facultad: facultad ? facultad.trim() : null,
            telefono: telefono ? telefono.trim() : null,
            edificio_habitual: edificio_habitual ? edificio_habitual.trim() : null,
            carrera: carrera ? carrera.trim() : null,
            semestre: semestre ? parseInt(semestre) : null,
            cedula: cedula ? cedula.trim() : null,
            activo: true,
            rol: 'usuario',
            fecha_registro: serverTimestamp(),
            ultima_actividad: serverTimestamp()
        };
        
        // Guardar usuario en Firebase
        await db.collection('usuarios').doc(userId).set(userData);
        
        // Generar tokens JWT
        const tokens = generateTokens(userId);
        
        // Preparar respuesta (sin contraseña)
        const responseUser = { ...userData };
        delete responseUser.contrasena;
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            data: {
                user: responseUser,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_EXPIRE || '24h'
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
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
                success: false,
                error: 'Datos requeridos',
                message: 'Correo y contraseña son obligatorios'
            });
        }
        
        const db = getDB();
        
        // Buscar usuario por correo
        const userQuery = await db.collection('usuarios')
            .where('correo', '==', correo.toLowerCase().trim())
            .get();
        
        if (userQuery.empty) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Correo o contraseña incorrectos'
            });
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        // Verificar si el usuario está activo
        if (!userData.activo) {
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada',
                message: 'Tu cuenta ha sido desactivada. Contacta al administrador'
            });
        }
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(contrasena, userData.contrasena);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Correo o contraseña incorrectos'
            });
        }
        
        // Generar tokens JWT
        const tokens = generateTokens(userData.id_usuario);
        
        // Actualizar última actividad del usuario
        await userDoc.ref.update({
            ultima_actividad: serverTimestamp()
        });
        
        // Preparar respuesta (sin contraseña)
        const responseUser = { ...userData };
        delete responseUser.contrasena;
        
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: responseUser,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: 'Bearer',
                expiresIn: process.env.JWT_EXPIRE || '24h'
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error iniciando sesión'
        });
    }
};

// Renovar token de acceso
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token requerido',
                message: 'El token de renovación es obligatorio'
            });
        }
        
        try {
            // Verificar refresh token
            const decoded = verifyRefreshToken(refreshToken);
            
            const db = getDB();
            
            // Verificar que el usuario existe y está activo
            const userDoc = await db.collection('usuarios').doc(decoded.id).get();
            
            if (!userDoc.exists || !userDoc.data().activo) {
                return res.status(401).json({
                    success: false,
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
                success: false,
                error: 'Refresh token inválido',
                message: 'El token de renovación no es válido o ha expirado'
            });
        }
        
    } catch (error) {
        console.error('Error renovando token:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error renovando el token'
        });
    }
};

// Cerrar sesión
const logout = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const db = getDB();
        
        // Actualizar la última actividad (opcional)
        await db.collection('usuarios').doc(userId).update({
            ultima_actividad: serverTimestamp()
        });
        
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
        
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'Error cerrando sesión'
        });
    }
};

// Verificar token válido (endpoint para validar sesión)
const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el middleware de auth ya validó el token
        const userId = req.user.id;
        
        const db = getDB();
        const userDoc = await db.collection('usuarios').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        const userData = userDoc.data();
        delete userData.contrasena; // No enviar contraseña
        
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: userData
            }
        });
        
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({
            success: false,
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
                success: false,
                error: 'Correo requerido',
                message: 'El correo electrónico es obligatorio'
            });
        }
        
        const db = getDB();
        
        // Verificar si el usuario existe
        const userQuery = await db.collection('usuarios')
            .where('correo', '==', correo.toLowerCase().trim())
            .where('activo', '==', true)
            .get();
        
        if (userQuery.empty) {
            // Por seguridad, no revelar si el email existe
            return res.json({
                success: true,
                message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'
            });
        }
        
        // Generar token de recuperación
        const resetToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        
        // Guardar token en el usuario con expiración (1 hora)
        const userDoc = userQuery.docs[0];
        await userDoc.ref.update({
            reset_token: resetToken,
            reset_token_expiry: new Date(Date.now() + 3600000) // 1 hora
        });
        
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
            success: false,
            error: 'Error interno del servidor',
            message: 'Error procesando la solicitud'
        });
    }
};

// Resetear contraseña con token
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, correo } = req.body;
        
        if (!token || !newPassword || !correo) {
            return res.status(400).json({
                success: false,
                error: 'Datos requeridos',
                message: 'Token, nueva contraseña y correo son obligatorios'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña débil',
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }
        
        const db = getDB();
        
        // Verificar usuario y token
        const userQuery = await db.collection('usuarios')
            .where('correo', '==', correo.toLowerCase().trim())
            .where('reset_token', '==', token)
            .where('activo', '==', true)
            .get();
        
        if (userQuery.empty) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido',
                message: 'El token de recuperación no es válido'
            });
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        // Verificar expiración del token
        if (userData.reset_token_expiry && userData.reset_token_expiry.toDate() < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Token expirado',
                message: 'El token de recuperación ha expirado'
            });
        }
        
        // Encriptar nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Actualizar contraseña y limpiar token
        await userDoc.ref.update({
            contrasena: hashedPassword,
            reset_token: null,
            reset_token_expiry: null,
            ultima_actividad: serverTimestamp()
        });
        
        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
        
    } catch (error) {
        console.error('Error en reset password:', error);
        res.status(500).json({
            success: false,
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