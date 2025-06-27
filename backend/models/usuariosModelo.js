import Usuario from '../schems/usuariosSchem.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../services/emailService.js';

// Configuración de seguridad
const PASSWORD_SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS) || 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos

class UsuarioModel {
    /**
     * Crea un nuevo usuario con verificación por email
     */
    async crear(usuarioData) {
        try {
            // Validación extendida
            const { email, clave } = usuarioData;
            if (!email || !clave) {
                throw this._buildError('VALIDATION_ERROR', 'Email y clave son requeridos');
            }

            // Verificar unicidad de email
            if (await Usuario.exists({ email })) {
                throw this._buildError('DUPLICATE_EMAIL', 'El email ya está registrado');
            }

            // Generar token de verificación
            const verificationToken = uuidv4();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

            // Crear usuario
            const usuario = new Usuario({
                ...usuarioData,
                clave: await this._hashClave(clave),
                verificationToken,
                verificationExpires,
                isVerified: false,
                loginAttempts: 0,
                blockExpires: null,
                role: 'USER' // Rol por defecto
            });

            await usuario.save();

            // Enviar email de verificación (asíncrono)
            sendVerificationEmail(email, verificationToken)
                .catch(error => console.error('Error sending verification email:', error));

            return this._sanitizeUser(usuario);
        } catch (error) {
            this._handleError(error, 'crear usuario');
        }
    }

    /**
     * Verifica el email de un usuario
     */
    async verificarEmail(token) {
        try {
            const usuario = await Usuario.findOneAndUpdate(
                { 
                    verificationToken: token,
                    verificationExpires: { $gt: new Date() }
                },
                { 
                    $set: { isVerified: true },
                    $unset: { verificationToken: 1, verificationExpires: 1 }
                },
                { new: true }
            );

            if (!usuario) {
                throw this._buildError('INVALID_TOKEN', 'Token inválido o expirado');
            }

            return this._sanitizeUser(usuario);
        } catch (error) {
            this._handleError(error, 'verificar email');
        }
    }

    /**
     * Obtiene usuario por ID (sin información sensible)
     */
    async obtenerPorId(id, includeSensitive = false) {
        try {
            let query = Usuario.findById(id);
            
            if (!includeSensitive) {
                query = query.select('-clave -__v -verificationToken -verificationExpires');
            }

            const usuario = await query.lean();

            if (!usuario) {
                throw this._buildError('USER_NOT_FOUND', 'Usuario no encontrado');
            }

            return usuario;
        } catch (error) {
            this._handleError(error, 'obtener usuario por ID');
        }
    }

    /**
     * Obtiene usuario por email (opcionalmente con información sensible)
     */
    async obtenerPorEmail(email, includeSensitive = false) {
        try {
            let query = Usuario.findOne({ email });
            
            if (includeSensitive) {
                query = query.select('+clave +loginAttempts +blockExpires');
            } else {
                query = query.select('-clave -__v');
            }

            const usuario = await query;

            if (!usuario) {
                throw this._buildError('USER_NOT_FOUND', 'Usuario no encontrado');
            }

            return usuario;
        } catch (error) {
            this._handleError(error, 'obtener usuario por email');
        }
    }

    /**
     * Actualiza datos de usuario
     */
    async actualizar(id, updateData, options = {}) {
        try {
            // Prevenir actualizaciones no permitidas
            const { clave, role, isVerified, ...safeUpdates } = updateData;
            
            const usuario = await Usuario.findByIdAndUpdate(
                id,
                { $set: safeUpdates },
                { 
                    new: true,
                    runValidators: true,
                    ...options
                }
            ).select('-clave -__v -verificationToken -verificationExpires');

            if (!usuario) {
                throw this._buildError('USER_NOT_FOUND', 'Usuario no encontrado');
            }

            return usuario;
        } catch (error) {
            this._handleError(error, 'actualizar usuario');
        }
    }

    /**
     * Cambia la contraseña de un usuario
     */
    async cambiarClave(id, nuevaClave) {
        try {
            const usuario = await Usuario.findById(id).select('+clave');
            
            if (!usuario) {
                throw this._buildError('USER_NOT_FOUND', 'Usuario no encontrado');
            }

            usuario.clave = await this._hashClave(nuevaClave);
            await usuario.save();

            return this._sanitizeUser(usuario);
        } catch (error) {
            this._handleError(error, 'cambiar clave');
        }
    }

    /**
     * Maneja intentos fallidos de login
     */
    async registrarIntentoFallido(email) {
        try {
            const usuario = await Usuario.findOneAndUpdate(
                { email },
                { 
                    $inc: { loginAttempts: 1 },
                    $set: { 
                        blockExpires: Date.now() + LOCK_TIME 
                    }
                },
                { new: true }
            );

            return usuario;
        } catch (error) {
            this._handleError(error, 'registrar intento fallido');
        }
    }

    /**
     * Resetea los intentos fallidos después de un login exitoso
     */
    async resetearIntentosFallidos(email) {
        try {
            const usuario = await Usuario.findOneAndUpdate(
                { email },
                { 
                    $set: { loginAttempts: 0, blockExpires: null }
                },
                { new: true }
            );

            return usuario;
        } catch (error) {
            this._handleError(error, 'resetear intentos fallidos');
        }
    }

    // --- Métodos auxiliares privados ---

    async _hashClave(clave) {
        return bcrypt.hash(clave, PASSWORD_SALT_ROUNDS);
    }

    _sanitizeUser(user) {
        if (!user) return null;
        
        const sanitized = user.toObject ? user.toObject() : { ...user };
        const camposSensibles = [
            'clave', 
            '__v', 
            'verificationToken', 
            'verificationExpires',
            'loginAttempts',
            'blockExpires'
        ];
        
        camposSensibles.forEach(campo => delete sanitized[campo]);
        return sanitized;
    }

    _buildError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    _handleError(error, context) {
        console.error(`[UsuarioModel] Error al ${context}:`, error.message);
        
        // Preservar errores personalizados
        if (error.code) {
            throw error;
        }
        
        // Manejar errores de Mongoose
        if (error.name === 'ValidationError') {
            throw this._buildError('VALIDATION_ERROR', error.message);
        }
        
        if (error.code === 11000) {
            throw this._buildError('DUPLICATE_KEY', 'El email ya está registrado');
        }
        
        throw this._buildError('DB_OPERATION_FAILED', `Error al ${context}`);
    }
}

export default new UsuarioModel();