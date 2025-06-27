import authMiddleware from '../middlewares/authMiddleware.js';
import usuarioModel from '../models/usuariosModelo.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sendWelcomeEmail } from '../services/emailService.js'; // Nuevo servicio de email

// Configuración de seguridad
const PASSWORD_SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS) || 10;
const LOGIN_ATTEMPTS_LIMIT = 5;
const LOGIN_BLOCK_TIME = 15 * 60 * 1000; // 15 minutos

class UsuarioController {
    /**
     * Registra un nuevo usuario con verificación de email
     */
    async registrar(req, res) {
        try {
            const { email, nombre, telefono, clave } = req.body;
            const verificationToken = uuidv4();

            // Crear usuario con token de verificación
            const nuevoUsuario = await usuarioModel.crear({
                nombre,
                email,
                telefono,
                clave: await this._hashClave(clave),
                verificationToken,
                isVerified: false,
                loginAttempts: 0,
                blockExpires: null
            });

            // Enviar email de verificación (asíncrono)
            sendWelcomeEmail(nuevoUsuario.email, verificationToken)
                .catch(error => console.error('Error sending welcome email:', error));

            // Generar token temporal (solo para verificación)
            const tempToken = authMiddleware.generateToken(
                nuevoUsuario._id,
                email,
                'UNVERIFIED',
                '1h' // Token de corta duración
            );

            res.status(201).json(this._buildResponse({
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                isVerified: false
            }, 'Usuario registrado. Por favor verifica tu email.', {
                tempToken
            }));

        } catch (error) {
            this._handleError(res, error, 'REGISTRATION_ERROR');
        }
    }

    /**
     * Verifica el email del usuario
     */
    async verificarEmail(req, res) {
        try {
            const { token } = req.params;
            const usuario = await usuarioModel.verificarEmail(token);

            if (!usuario) {
                return res.status(400).json(this._buildError(
                    'INVALID_TOKEN',
                    'Token de verificación inválido o expirado'
                ));
            }

            // Generar token completo ahora que está verificado
            const authToken = authMiddleware.generateToken(
                usuario._id,
                usuario.email,
                'USER' // Rol por defecto
            );

            res.status(200).json(this._buildResponse({
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                isVerified: true
            }, 'Email verificado exitosamente', {
                token: authToken
            }));

        } catch (error) {
            this._handleError(res, error, 'EMAIL_VERIFICATION_ERROR');
        }
    }

    /**
     * Autentica un usuario con protección contra fuerza bruta
     */
    async login(req, res) {
        try {
            const { email, clave } = req.body;
            const ip = req.ip;

            // Verificar bloqueo por intentos fallidos
            const usuario = await usuarioModel.obtenerPorEmail(email);
            if (usuario?.blockExpires && usuario.blockExpires > new Date()) {
                const remainingTime = Math.ceil((usuario.blockExpires - new Date()) / 60000);
                return res.status(429).json(this._buildError(
                    'ACCOUNT_BLOCKED',
                    `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime} minutos.`
                ));
            }

            // Validar credenciales
            if (!usuario || !(await this._validarClave(clave, usuario.clave))) {
                // Incrementar contador de intentos fallidos
                if (usuario) {
                    await usuarioModel.registrarIntentoFallido(usuario._id, LOGIN_ATTEMPTS_LIMIT, LOGIN_BLOCK_TIME);
                }

                return res.status(401).json(this._buildError(
                    'INVALID_CREDENTIALS',
                    'Email o contraseña incorrectos'
                ));
            }

            // Verificar si el email está confirmado
            if (!usuario.isVerified) {
                return res.status(403).json(this._buildError(
                    'UNVERIFIED_EMAIL',
                    'Por favor verifica tu email antes de iniciar sesión'
                ));
            }

            // Resetear contador de intentos fallidos
            await usuarioModel.resetearIntentosFallidos(usuario._id);

            // Generar token de acceso y refresh token
            const accessToken = authMiddleware.generateToken(
                usuario._id,
                usuario.email,
                usuario.role || 'USER',
                '1h' // Token de acceso de corta duración
            );

            const refreshToken = authMiddleware.generateToken(
                usuario._id,
                null, // No incluir email en refresh token
                null, // No incluir rol en refresh token
                '7d' // Refresh token de larga duración
            );

            res.status(200).json(this._buildResponse({
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                role: usuario.role
            }, 'Inicio de sesión exitoso', {
                tokens: {
                    access: accessToken,
                    refresh: refreshToken
                }
            }));

        } catch (error) {
            this._handleError(res, error, 'LOGIN_ERROR');
        }
    }

    /**
     * Obtiene el perfil del usuario actual
     */
    async obtenerPerfil(req, res) {
        try {
            const usuario = await usuarioModel.obtenerPerfilSeguro(req.user.id);

            if (!usuario) {
                return res.status(404).json(this._buildError(
                    'USER_NOT_FOUND',
                    'Usuario no encontrado'
                ));
            }

            res.status(200).json(this._buildResponse(usuario));

        } catch (error) {
            this._handleError(res, error, 'FETCH_PROFILE_ERROR');
        }
    }

    /**
     * Actualiza el perfil del usuario
     */
    async actualizarPerfil(req, res) {
        try {
            const updates = this._filtrarActualizaciones(req.body);
            const usuario = await usuarioModel.actualizar(req.user.id, updates);

            res.status(200).json(this._buildResponse(
                usuario,
                'Perfil actualizado exitosamente'
            ));

        } catch (error) {
            this._handleError(res, error, 'UPDATE_PROFILE_ERROR');
        }
    }

    /**
     * Solicita reset de contraseña
     */
    async solicitarResetClave(req, res) {
        try {
            const { email } = req.body;
            const resetToken = uuidv4();

            await usuarioModel.generarTokenReset(email, resetToken);

            // Enviar email con link de reset (asíncrono)
            sendPasswordResetEmail(email, resetToken)
                .catch(error => console.error('Error sending reset email:', error));

            res.status(200).json(this._buildResponse(
                null,
                'Si el email existe, se ha enviado un link para resetear la contraseña'
            ));

        } catch (error) {
            this._handleError(res, error, 'PASSWORD_RESET_REQUEST_ERROR');
        }
    }

    // --- Métodos auxiliares privados ---

    async _hashClave(clave) {
        return bcrypt.hash(clave, PASSWORD_SALT_ROUNDS);
    }

    async _validarClave(claveIngresada, claveHash) {
        return bcrypt.compare(claveIngresada, claveHash);
    }

    _filtrarActualizaciones(body) {
        const camposPermitidos = ['nombre', 'telefono', 'avatar'];
        const updates = {};

        for (const campo of camposPermitidos) {
            if (body[campo] !== undefined) {
                updates[campo] = body[campo];
            }
        }

        return updates;
    }

    _buildResponse(data, message = '', extras = {}) {
        return {
            success: true,
            data: this._sanitizeUserData(data),
            message,
            ...extras
        };
    }

    _sanitizeUserData(user) {
        if (!user) return user;

        const sanitized = { ...user };
        const camposSensibles = ['clave', 'verificationToken', 'resetToken', 'loginAttempts', 'blockExpires'];

        camposSensibles.forEach(campo => delete sanitized[campo]);
        return sanitized;
    }

    _buildError(code, message, details = null) {
        const error = { code, message };
        if (details) error.details = details;

        return {
            success: false,
            error,
            timestamp: new Date().toISOString()
        };
    }

    _handleError(res, error, context) {
        console.error(`[${context}]`, error);

        // Manejo de errores específicos
        let status = 500;
        let errorCode = 'SERVER_ERROR';
        let errorMessage = 'Error en el servidor';

        if (error.name === 'ValidationError') {
            status = 400;
            errorCode = 'VALIDATION_ERROR';
            errorMessage = error.message;
        } else if (error.code === 11000) {
            status = 409;
            errorCode = 'DUPLICATE_KEY';
            errorMessage = 'El email ya está registrado';
        }

        const response = this._buildError(errorCode, errorMessage);

        if (process.env.NODE_ENV === 'development') {
            response.error.stack = error.stack;
        }

        res.status(status).json(response);
    }
}

// Singleton para reutilizar la instancia
export const usuarioController = new UsuarioController();