// src/pages/Login.jsx - DISEÑO UTP CON COLORES MORADO Y BLANCO
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  // Estados principales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Estados de validación
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  
  // Datos adicionales para registro
  const [additionalData, setAdditionalData] = useState({
    nombre: '',
    apellido: '',
    facultad: '',
    telefono: '',
    carrera: '',
    semestre: '',
    cedula: ''
  });
  
  // Estados de validación para registro
  const [validationErrors, setValidationErrors] = useState({});

  const { login, register, checkEmailAvailability } = useAuth();
  const navigate = useNavigate();

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add('login-page');
    
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  // Validar email en tiempo real
  const validateEmail = useCallback((email) => {
    if (!email) return '';
    if (!email.includes('@')) return 'Formato de email inválido';
    if (!email.endsWith('@utp.ac.pa')) return 'Debe ser un correo @utp.ac.pa';
    
    const emailPrefix = email.split('@')[0];
    if (emailPrefix.length < 3) return 'El nombre de usuario es muy corto';
    if (!/^[a-zA-Z0-9._-]+$/.test(emailPrefix)) return 'Caracteres no válidos en el email';
    
    return '';
  }, []);

  // Validar contraseña en tiempo real
  const validatePassword = useCallback((password, isRegistration = false) => {
    if (!password) return '';
    if (password.length < 6) return 'Mínimo 6 caracteres';
    
    if (isRegistration) {
      const errors = [];
      if (password.length < 8) errors.push('mínimo 8 caracteres');
      if (!/[a-z]/.test(password)) errors.push('una minúscula');
      if (!/[A-Z]/.test(password)) errors.push('una mayúscula');
      if (!/\d/.test(password)) errors.push('un número');
      
      const commonPasswords = ['123456', 'password', 'qwerty', 'abc123'];
      if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('muy común');
      }
      
      if (errors.length > 0) {
        return `Necesita: ${errors.join(', ')}`;
      }
    }
    
    return '';
  }, []);

  // Validar datos de registro
  const validateRegistrationData = useCallback(() => {
    const errors = {};
    
    if (!additionalData.nombre || additionalData.nombre.trim().length < 2) {
      errors.nombre = 'Mínimo 2 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(additionalData.nombre)) {
      errors.nombre = 'Solo letras y espacios';
    }
    
    if (!additionalData.apellido || additionalData.apellido.trim().length < 2) {
      errors.apellido = 'Mínimo 2 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(additionalData.apellido)) {
      errors.apellido = 'Solo letras y espacios';
    }
    
    if (additionalData.telefono) {
      const phoneRegex = /^\+?507[-\s]?\d{4}[-\s]?\d{4}$/;
      if (!phoneRegex.test(additionalData.telefono.replace(/\s/g, ''))) {
        errors.telefono = 'Formato: +507 1234-5678';
      }
    }
    
    if (additionalData.semestre && (additionalData.semestre < 1 || additionalData.semestre > 12)) {
      errors.semestre = 'Entre 1 y 12';
    }
    
    if (additionalData.cedula) {
      const cedulaRegex = /^\d{1,2}-\d{1,4}-\d{1,6}$/;
      if (!cedulaRegex.test(additionalData.cedula)) {
        errors.cedula = 'Formato: 8-123-456';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [additionalData]);

  // Auto-completar nombre basado en email
  const handleEmailChange = async (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    setEmailChecked(false);
    
    const error = validateEmail(emailValue);
    setEmailError(error);
    
    if (emailValue.includes('@utp.ac.pa') && !error) {
      const emailPrefix = emailValue.split('@')[0];
      const nameParts = emailPrefix.split('.');
      
      if (nameParts.length >= 2) {
        setAdditionalData(prev => ({
          ...prev,
          nombre: nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1),
          apellido: nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
        }));
      }
      
      clearTimeout(window.emailCheckTimeout);
      window.emailCheckTimeout = setTimeout(async () => {
        if (checkEmailAvailability) {
          try {
            const result = await checkEmailAvailability(emailValue);
            setEmailAvailable(result.available);
            setEmailChecked(true);
          } catch (error) {
            console.error('Error verificando email:', error);
          }
        }
      }, 500);
    }
  };

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);
    
    const error = validatePassword(passwordValue, isNewUser);
    setPasswordError(error);
  };

  const handleAdditionalDataChange = (field, value) => {
    setAdditionalData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('No hay conexión a internet. Verifica tu conexión.');
      return;
    }
    
    setLoading(true);
    setError('');

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setLoading(false);
      return;
    }

    const passwordValidationError = validatePassword(password, isNewUser);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      setLoading(false);
      return;
    }

    try {
      if (isNewUser) {
        if (!validateRegistrationData()) {
          setError('Por favor corrige los errores en el formulario');
          setLoading(false);
          return;
        }
        
        setLoadingStep('Creando cuenta...');

        const registerData = {
          nombre: additionalData.nombre.trim(),
          apellido: additionalData.apellido.trim(),
          correo: email,
          contrasena: password,
          facultad: additionalData.facultad || null,
          telefono: additionalData.telefono ? additionalData.telefono.replace(/\s/g, '') : null,
          carrera: additionalData.carrera || null,
          semestre: additionalData.semestre ? parseInt(additionalData.semestre) : null,
          cedula: additionalData.cedula || null
        };

        const result = await register(registerData);
        
        if (result.success) {
          setLoadingStep('Redirigiendo...');
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          navigate('/principal');
        } else {
          if (result.message?.includes('ya existe')) {
            setIsNewUser(false);
            setError('Este email ya está registrado. Intenta iniciar sesión.');
          } else if (result.message?.includes('Contraseña débil')) {
            setPasswordError(result.message);
            setError('');
          } else {
            setError(result.message || 'Error al registrar usuario');
          }
        }
      } else {
        setLoadingStep('Verificando credenciales...');
        
        const result = await login(email, password, rememberMe);
        
        if (result.success) {
          setLoadingStep('Redirigiendo...');
          navigate('/principal');
        } else {
          if (result.suggestRegistration) {
            setIsNewUser(true);
            setError('Parece que es tu primera vez. Completa los datos para registrarte.');
          } else if (result.message?.includes('Demasiados intentos')) {
            setError(result.message);
          } else if (result.message?.includes('inactiv')) {
            setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
          } else {
            setError(result.message || 'Error al iniciar sesión');
          }
        }
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else {
        setError('Error inesperado. Intenta de nuevo en unos momentos.');
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const toggleMode = () => {
    setIsNewUser(!isNewUser);
    setError('');
    setEmailError('');
    setPasswordError('');
    setValidationErrors({});
    setEmailChecked(false);
    setEmailAvailable(true);
  };

  const getPasswordStrengthColor = () => {
    if (!password) return '#e0e0e0';
    if (passwordError) return '#dc3545';
    if (password.length < 8) return '#ffc107';
    
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score >= 3) return '#28a745';
    if (score >= 2) return '#ffc107';
    return '#dc3545';
  };

  const getPasswordStrengthText = () => {
    if (!password) return '';
    if (passwordError) return passwordError;
    if (password.length < 8) return 'Débil';
    
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score >= 3) return 'Fuerte';
    if (score >= 2) return 'Media';
    return 'Débil';
  };

  return (
    <div className="login-page-container">
      {/* Indicador de conexión */}
      {!isOnline && (
        <div className="offline-banner">
          <span>⚠️ Sin conexión a internet</span>
        </div>
      )}

      <div className={`login-wrapper ${isNewUser ? 'registration-mode' : 'login-mode'}`}>

        <div className="login-card">
          {/* Logo y título */}
          <div className="login-header">
            <div className="logo-container">
              <img src="/imagenes/logoUTP.png" alt="UTP Logo" className="logo-utp" />
              <img src="/imagenes/logo.png" alt="UTPedidos Logo" className="logo-utpedidos" />
            </div>
            <h1 className="app-title">UTPedidos</h1>
            <p className="app-subtitle">
              {isNewUser ? 
                'Crea tu cuenta para empezar a pedir' : 
                'Inicia sesión en tu cuenta'
              }
            </p>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="error-alert">
              <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Formulario */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Correo electrónico
                {emailChecked && !emailAvailable && (
                  <span className="status-badge error">Ya registrado</span>
                )}
                {emailChecked && emailAvailable && (
                  <span className="status-badge success">Disponible</span>
                )}
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  className={`input-field ${emailError ? 'error' : ''} ${emailChecked && emailAvailable ? 'success' : ''}`}
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="usuario@utp.ac.pa"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {emailError && <span className="input-error">{emailError}</span>}
            </div>

            {/* Contraseña */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Contraseña
                {isNewUser && password && (
                  <span className={`strength-indicator ${getPasswordStrengthText().toLowerCase()}`}>
                    {getPasswordStrengthText()}
                  </span>
                )}
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`input-field ${passwordError ? 'error' : ''}`}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete={isNewUser ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    {showPassword ? (
                      <>
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </>
                    ) : (
                      <>
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {isNewUser && password && (
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      backgroundColor: getPasswordStrengthColor(),
                      width: password.length >= 8 ? '100%' : '50%'
                    }}
                  />
                </div>
              )}
              {passwordError && <span className="input-error">{passwordError}</span>}
            </div>

            {/* Campos adicionales para registro */}
            {isNewUser && (
              <div className="registration-section">
                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="nombre" className="input-label">Nombre *</label>
                    <input
                      type="text"
                      id="nombre"
                      className={`input-field ${validationErrors.nombre ? 'error' : ''}`}
                      value={additionalData.nombre}
                      onChange={(e) => handleAdditionalDataChange('nombre', e.target.value)}
                      placeholder="Tu nombre"
                      required
                      disabled={loading}
                      autoComplete="given-name"
                    />
                    {validationErrors.nombre && <span className="input-error">{validationErrors.nombre}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="apellido" className="input-label">Apellido *</label>
                    <input
                      type="text"
                      id="apellido"
                      className={`input-field ${validationErrors.apellido ? 'error' : ''}`}
                      value={additionalData.apellido}
                      onChange={(e) => handleAdditionalDataChange('apellido', e.target.value)}
                      placeholder="Tu apellido"
                      required
                      disabled={loading}
                      autoComplete="family-name"
                    />
                    {validationErrors.apellido && <span className="input-error">{validationErrors.apellido}</span>}
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="facultad" className="input-label">Facultad</label>
                  <select
                    id="facultad"
                    className="input-field"
                    value={additionalData.facultad}
                    onChange={(e) => handleAdditionalDataChange('facultad', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Selecciona tu facultad</option>
                    <option value="FCT - Facultad de Ciencias y Tecnología">Facultad de Ciencias y Tecnología</option>
                    <option value="FIC - Facultad de Ingeniería Civil">Facultad de Ingeniería Civil</option>
                    <option value="FIE - Facultad de Ingeniería Eléctrica">Facultad de Ingeniería Eléctrica</option>
                    <option value="FII - Facultad de Ingeniería Industrial">Facultad de Ingeniería Industrial</option>
                    <option value="FIM - Facultad de Ingeniería Mecánica">Facultad de Ingeniería Mecánica</option>
                    <option value="FISC - Facultad de Ingeniería de Sistemas Computacionales">Facultad de Ingeniería de Sistemas Computacionales</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="telefono" className="input-label">Teléfono</label>
                    <input
                      type="tel"
                      id="telefono"
                      className={`input-field ${validationErrors.telefono ? 'error' : ''}`}
                      value={additionalData.telefono}
                      onChange={(e) => handleAdditionalDataChange('telefono', e.target.value)}
                      placeholder="+507 1234-5678"
                      disabled={loading}
                      autoComplete="tel"
                    />
                    {validationErrors.telefono && <span className="input-error">{validationErrors.telefono}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="semestre" className="input-label">Semestre</label>
                    <select
                      id="semestre"
                      className={`input-field ${validationErrors.semestre ? 'error' : ''}`}
                      value={additionalData.semestre}
                      onChange={(e) => handleAdditionalDataChange('semestre', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Selecciona</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    {validationErrors.semestre && <span className="input-error">{validationErrors.semestre}</span>}
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="carrera" className="input-label">Carrera/Especialización</label>
                  <input
                    type="text"
                    id="carrera"
                    className="input-field"
                    value={additionalData.carrera}
                    onChange={(e) => handleAdditionalDataChange('carrera', e.target.value)}
                    placeholder="Ej: Ingeniería de Software"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Recordarme - solo para login */}
            {!isNewUser && (
              <div className="remember-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Recordarme
                </label>
              </div>
            )}

            {/* Botón de envío */}
            <button 
              type="submit" 
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading || !isOnline}
            >
              {loading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  <span>{loadingStep || (isNewUser ? 'Registrando...' : 'Iniciando Sesión...')}</span>
                </div>
              ) : (
                isNewUser ? 'Crear Cuenta' : 'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Toggle entre modos */}
          <div className="toggle-section">
            {!isNewUser ? (
              <p>
                ¿Primera vez en UTPedidos?{' '}
                <button type="button" className="toggle-btn" onClick={toggleMode} disabled={loading}>
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{' '}
                <button type="button" className="toggle-btn" onClick={toggleMode} disabled={loading}>
                  Inicia sesión
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Sección lateral con slogan */}
        <div className="branding-section">
          <div className="branding-content">
            <h2 className="brand-title">UTPedidos</h2>
            <p className="brand-slogan">Tu cafetería universitaria al alcance</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">🍕</span>
                <span>Comida fresca</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Entrega rápida</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💜</span>
                <span>Hecho para UTP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;