import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import 'dotenv/config';

// Configuración JWT
const JWT_CONFIG = {
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  issuer: process.env.JWT_ISSUER || 'myapp-api',
  audience: process.env.JWT_AUDIENCE || 'myapp-client',
  algorithms: ['HS256']
};

// Blacklist de tokens (en producción usar Redis)
const tokenBlacklist = new Set();

// Limpiar blacklist periódicamente
setInterval(() => {
  console.log('🔄 Cleaning expired tokens from blacklist');
  tokenBlacklist.clear();
}, 3600000); // Cada hora

const authMiddleware = {
  /**
   * Genera un token JWT
   * @param {string} userId - ID del usuario
   * @param {string} email - Email del usuario
   * @param {string} role - Rol del usuario (default: 'USER')
   * @returns {string} Token JWT
   */
  generateToken: (userId, email, role = 'USER') => {
    if (!isValidObjectId(userId)) {
      throw new Error('Invalid user ID format');
    }

    return jwt.sign(
      { 
        userId, 
        email,
        role,
        iss: JWT_CONFIG.issuer,
        aud: JWT_CONFIG.audience
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: JWT_CONFIG.expiresIn,
        algorithm: JWT_CONFIG.algorithms[0]
      }
    );
  },

  /**
   * Middleware para verificar token JWT
   */
  verifyToken: (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'MISSING_TOKEN',
        error: 'Authentication token required',
        docs: 'https://api.yourdomain.com/docs/auth'
      });
    }

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        code: 'REVOKED_TOKEN',
        error: 'Token has been revoked'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
        algorithms: JWT_CONFIG.algorithms
      });
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000)
      };
      
      next();
    } catch (error) {
      const errorType = error.name === 'TokenExpiredError' 
        ? 'TOKEN_EXPIRED' 
        : 'INVALID_TOKEN';
      
      const response = {
        success: false,
        code: errorType,
        error: error.message
      };

      if (errorType === 'TOKEN_EXPIRED') {
        response.expiredAt = new Date(error.expiredAt).toISOString();
      }

      res.status(401).json(response);
    }
  },

  /**
   * Invalida un token JWT
   * @param {string} token - Token a invalidar
   */
  invalidateToken: (token) => {
    if (!token) return;
    
    try {
      const decoded = jwt.decode(token);
      const ttl = decoded?.exp 
        ? (decoded.exp * 1000 - Date.now()) 
        : 3600000; // 1h por defecto
      
      tokenBlacklist.add(token);
      
      // Auto-remover token después de su expiración
      if (ttl > 0) {
        setTimeout(() => tokenBlacklist.delete(token), ttl);
      }
    } catch (error) {
      console.error('Error invalidating token:', error);
    }
  },

  /**
   * Middleware para validar ObjectIDs de MongoDB
   * @param {string} field - Nombre del campo a validar (default: 'id')
   */
  validateObjectId: (field = 'id') => (req, res, next) => {
    const id = req.params[field] || req.body[field];
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        error: `Invalid resource ID format`,
        expected: '24-character hex string'
      });
    }
    
    next();
  },

  /**
   * Middleware para validar roles de usuario
   * @param {string[]} requiredRoles - Roles permitidos
   */
  checkRole: (requiredRoles = []) => {
    if (!Array.isArray(requiredRoles)) {
      throw new Error('Required roles must be an array');
    }

    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          error: 'User authentication required'
        });
      }

      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          error: 'Insufficient permissions',
          requiredRoles,
          userRole: req.user.role
        });
      }

      next();
    };
  },

  /**
   * Middleware para validar datos de proyecto
   */
  validateProject: (req, res, next) => {
    const { nombre, descripcion, tecnologias } = req.body;
    const errors = [];

    if (!nombre?.trim()) {
      errors.push({
        field: 'nombre',
        error: 'Project name is required',
        example: 'Mi Proyecto'
      });
    } else if (nombre.length > 100) {
      errors.push({
        field: 'nombre',
        error: 'Project name must be less than 100 characters'
      });
    }

    if (descripcion && descripcion.length > 500) {
      errors.push({
        field: 'descripcion',
        error: 'Description must be less than 500 characters'
      });
    }

    if (!Array.isArray(tecnologias)) {
      errors.push({
        field: 'tecnologias',
        error: 'Technologies must be an array',
        example: ['React', 'Node.js']
      });
    } else if (tecnologias.some(tech => typeof tech !== 'string')) {
      errors.push({
        field: 'tecnologias',
        error: 'All technologies must be strings'
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        errors
      });
    }

    next();
  },

  /**
   * Middleware para validar credenciales de usuario
   */
  validateCredentials: (req, res, next) => {
    const { email, clave } = req.body;
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        error: 'Valid email required',
        example: 'usuario@dominio.com'
      });
    }

    if (!clave || clave.length < 8) {
      errors.push({
        field: 'clave',
        error: 'Password must be at least 8 characters'
      });
    } else if (clave.length > 50) {
      errors.push({
        field: 'clave',
        error: 'Password must be less than 50 characters'
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        errors
      });
    }

    next();
  }
};

export default authMiddleware;