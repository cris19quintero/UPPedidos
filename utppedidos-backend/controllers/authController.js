    // ===== controllers/authController.js - Controlador de autenticación Firebase MEJORADO =====
    const bcrypt = require('bcryptjs');
    const { getDB, generateId, serverTimestamp } = require('../config/database');
    const { generateTokens, verifyRefreshToken } = require('../middleware/authMiddleware');

    // Rate limiting simple (en producción usar Redis)
    const loginAttempts = new Map();
    const registrationAttempts = new Map();

    // Función para verificar rate limiting
    const checkRateLimit = (email, type = 'login') => {
        const attemptsMap = type === 'login' ? loginAttempts : registrationAttempts;
        const attempts = attemptsMap.get(email) || { count: 0, lastAttempt: Date.now() };
        const now = Date.now();
        const timeWindow = 15 * 60 * 1000; // 15 minutos
        
        // Reset si ha pasado el tiempo
        if (now - attempts.lastAttempt > timeWindow) {
            attempts.count = 0;
        }
        
        const maxAttempts = type === 'login' ? 5 : 3;
        if (attempts.count >= maxAttempts) {
            const waitTime = Math.ceil((timeWindow - (now - attempts.lastAttempt)) / 60000);
            throw new Error(`Demasiados intentos. Intenta en ${waitTime} minutos.`);
        }
        
        attempts.count++;
        attempts.lastAttempt = now;
        attemptsMap.set(email, attempts);
    };

    // Función para limpiar intentos exitosos
    const clearAttempts = (email, type = 'login') => {
        const attemptsMap = type === 'login' ? loginAttempts : registrationAttempts;
        attemptsMap.delete(email);
    };

    // Validaciones mejoradas
    const validateRegistrationData = (data) => {
        const errors = [];
        
        // Validar nombre y apellido
        if (!data.nombre || data.nombre.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!data.apellido || data.apellido.trim().length < 2) {
            errors.push('El apellido debe tener al menos 2 caracteres');
        }
        
        // Validar teléfono panameño
        if (data.telefono && !/^\+?507[-\s]?\d{4}[-\s]?\d{4}$/.test(data.telefono.replace(/\s/g, ''))) {
            errors.push('Formato de teléfono inválido para Panamá (ej: +507 1234-5678)');
        }
        
        // Validar semestre
        if (data.semestre && (data.semestre < 1 || data.semestre > 12)) {
            errors.push('Semestre debe estar entre 1 y 12');
        }
        
        // Validar cédula panameña
        if (data.cedula && !/^\d{1,2}-\d{1,4}-\d{1,6}$/.test(data.cedula)) {
            errors.push('Formato de cédula inválido (ej: 8-123-456)');
        }
        
        // Validar nombres que no contengan números
        if (data.nombre && /\d/.test(data.nombre)) {
            errors.push('El nombre no puede contener números');
        }
        
        if (data.apellido && /\d/.test(data.apellido)) {
            errors.push('El apellido no puede contener números');
        }
        
        return errors;
    };

    // Función para limpiar y normalizar datos
    const sanitizeUserData = (data) => {
        return {
            nombre: data.nombre?.trim().replace(/\s+/g, ' '),
            apellido: data.apellido?.trim().replace(/\s+/g, ' '),
            correo: data.correo?.toLowerCase().trim(),
            telefono: data.telefono?.replace(/\s/g, '').replace(/-/g, '') || null,
            facultad: data.facultad?.trim() || null,
            edificio_habitual: data.edificio_habitual?.trim() || null,
            carrera: data.carrera?.trim() || null,
            semestre: data.semestre ? parseInt(data.semestre) : null,
            cedula: data.cedula?.trim() || null
        };
    };

    // Registro de usuario mejorado
    const register = async (req, res) => {
        try {
            const rawData = req.body;
            
            // Rate limiting
            try {
                checkRateLimit(rawData.correo, 'registration');
            } catch (rateLimitError) {
                return res.status(429).json({
                    success: false,
                    error: 'Demasiados intentos',
                    message: rateLimitError.message
                });
            }
            
            // Sanitizar datos
            const userData = sanitizeUserData(rawData);
            const { nombre, apellido, correo, contrasena } = userData;
            
            // Validaciones básicas
            if (!nombre || !apellido || !correo || !rawData.contrasena) {
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
            
            // Validaciones adicionales
            const validationErrors = validateRegistrationData({ ...userData, contrasena: rawData.contrasena });
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    message: validationErrors.join(', ')
                });
            }
            
            // Validar contraseña
            if (rawData.contrasena.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña débil',
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            
            // Validar fortaleza de contraseña
            const hasUpperCase = /[A-Z]/.test(rawData.contrasena);
            const hasLowerCase = /[a-z]/.test(rawData.contrasena);
            const hasNumbers = /\d/.test(rawData.contrasena);
            
            if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña débil',
                    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
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
            const hashedPassword = await bcrypt.hash(rawData.contrasena, saltRounds);
            
            // Generar ID único para el usuario
            const userId = generateId();
            
            // Crear datos del usuario
            const finalUserData = {
                id_usuario: userId,
                ...userData,
                contrasena: hashedPassword,
                activo: true,
                rol: 'usuario',
                fecha_registro: serverTimestamp(),
                ultima_actividad: serverTimestamp(),
                intentos_login: 0,
                verificado: false // Para futuras implementaciones de verificación por email
            };
            
            // Guardar usuario en Firebase
            await db.collection('usuarios').doc(userId).set(finalUserData);
            
            // Limpiar intentos de registro
            clearAttempts(correo, 'registration');
            
            // Generar tokens JWT
            const tokens = generateTokens(userId);
            
            // Preparar respuesta (sin contraseña)
            const responseUser = { ...finalUserData };
            delete responseUser.contrasena;
            
            // Log de registro exitoso
            console.log(`Usuario registrado exitosamente: ${correo} - ID: ${userId}`);
            
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

    // Inicio de sesión mejorado
    const login = async (req, res) => {
        try {
            const { correo, contrasena } = req.body;
            const email = correo?.toLowerCase().trim();
            
            // Validaciones básicas
            if (!email || !contrasena) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos requeridos',
                    message: 'Correo y contraseña son obligatorios'
                });
            }
            
            // Rate limiting
            try {
                checkRateLimit(email, 'login');
            } catch (rateLimitError) {
                return res.status(429).json({
                    success: false,
                    error: 'Demasiados intentos',
                    message: rateLimitError.message
                });
            }
            
            const db = getDB();
            
            // Buscar usuario por correo
            const userQuery = await db.collection('usuarios')
                .where('correo', '==', email)
                .get();
            
            if (userQuery.empty) {
                const isUTPEmail = email.endsWith('@utp.ac.pa');
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    message: isUTPEmail ? 'Usuario no encontrado. ¿Es tu primera vez?' : 'Correo o contraseña incorrectos',
                    suggestRegistration: isUTPEmail
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
                // Incrementar contador de intentos fallidos
                const intentos = (userData.intentos_login || 0) + 1;
                await userDoc.ref.update({
                    intentos_login: intentos,
                    ultimo_intento_fallido: serverTimestamp()
                });
                
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    message: 'Correo o contraseña incorrectos'
                });
            }
            
            // Login exitoso - limpiar intentos
            clearAttempts(email, 'login');
            
            // Generar tokens JWT
            const tokens = generateTokens(userData.id_usuario);
            
            // Actualizar datos de login exitoso
            await userDoc.ref.update({
                ultima_actividad: serverTimestamp(),
                intentos_login: 0,
                ultimo_login: serverTimestamp()
            });
            
            // Preparar respuesta (sin contraseña)
            const responseUser = { ...userData };
            delete responseUser.contrasena;
            
            // Log de login exitoso
            console.log(`Login exitoso: ${email} - ID: ${userData.id_usuario}`);
            
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

    // Renovar token de acceso mejorado
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
                
                if (!userDoc.exists) {
                    return res.status(401).json({
                        success: false,
                        error: 'Usuario no encontrado',
                        message: 'El usuario no existe'
                    });
                }
                
                const userData = userDoc.data();
                
                if (!userData.activo) {
                    return res.status(401).json({
                        success: false,
                        error: 'Usuario inválido',
                        message: 'El usuario está inactivo'
                    });
                }
                
                // Generar nuevos tokens
                const tokens = generateTokens(decoded.id);
                
                // Actualizar última actividad
                await userDoc.ref.update({
                    ultima_actividad: serverTimestamp()
                });
                
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
                console.error('Error de token:', tokenError);
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
            
            // Actualizar la última actividad
            await db.collection('usuarios').doc(userId).update({
                ultima_actividad: serverTimestamp(),
                ultimo_logout: serverTimestamp()
            });
            
            console.log(`Logout exitoso: ${req.user.email} - ID: ${userId}`);
            
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
            
            if (!userData.activo) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario inactivo',
                    message: 'La cuenta ha sido desactivada'
                });
            }
            
            delete userData.contrasena; // No enviar contraseña
            
            // Actualizar última actividad
            await userDoc.ref.update({
                ultima_actividad: serverTimestamp()
            });
            
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

    // Solicitar recuperación de contraseña mejorado
    const forgotPassword = async (req, res) => {
        try {
            const { correo } = req.body;
            const email = correo?.toLowerCase().trim();
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Correo requerido',
                    message: 'El correo electrónico es obligatorio'
                });
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Email inválido',
                    message: 'El formato del correo electrónico no es válido'
                });
            }
            
            const db = getDB();
            
            // Verificar si el usuario existe
            const userQuery = await db.collection('usuarios')
                .where('correo', '==', email)
                .where('activo', '==', true)
                .get();
            
            if (userQuery.empty) {
                // Por seguridad, no revelar si el email existe
                return res.json({
                    success: true,
                    message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'
                });
            }
            
            // Generar token de recuperación más seguro
            const resetToken = require('crypto').randomBytes(32).toString('hex');
            
            // Guardar token en el usuario con expiración (1 hora)
            const userDoc = userQuery.docs[0];
            await userDoc.ref.update({
                reset_token: resetToken,
                reset_token_expiry: new Date(Date.now() + 3600000), // 1 hora
                reset_requested_at: serverTimestamp()
            });
            
            console.log(`Token de recuperación generado para ${email}: ${resetToken}`);
            
            // TODO: Aquí enviarías el email con el token
            // await sendPasswordResetEmail(email, resetToken);
            
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

    // Resetear contraseña con token mejorado
    const resetPassword = async (req, res) => {
        try {
            const { token, newPassword, correo } = req.body;
            const email = correo?.toLowerCase().trim();
            
            if (!token || !newPassword || !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos requeridos',
                    message: 'Token, nueva contraseña y correo son obligatorios'
                });
            }
            
            // Validar contraseña
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña débil',
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            
            // Validar fortaleza de contraseña
            const hasUpperCase = /[A-Z]/.test(newPassword);
            const hasLowerCase = /[a-z]/.test(newPassword);
            const hasNumbers = /\d/.test(newPassword);
            
            if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña débil',
                    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
                });
            }
            
            const db = getDB();
            
            // Verificar usuario y token
            const userQuery = await db.collection('usuarios')
                .where('correo', '==', email)
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
                reset_requested_at: null,
                password_reset_at: serverTimestamp(),
                ultima_actividad: serverTimestamp()
            });
            
            console.log(`Contraseña restablecida exitosamente para: ${email}`);
            
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