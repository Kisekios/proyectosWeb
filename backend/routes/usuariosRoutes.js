import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validatorMiddleware.js'; // Nuevo middleware de validación
import rateLimit from 'express-rate-limit';

const router = Router();

// Configuración de rate limiting para endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Límite de 10 peticiones por ventana
  message: '⚠️ Too many login attempts, please try again later'
});

/**
 * @openapi
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios y autenticación
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// =============================================
// Endpoints públicos (sin autenticación)
// =============================================

/**
 * @openapi
 * /usuarios/registrarse:
 *   post:
 *     tags: [Usuarios]
 *     summary: Registrar un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegistro'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El usuario ya existe
 */
router.post('/registrarse',
  validate('registerUser'),
  authLimiter,
  usuarioController.registrar
);

/**
 * @openapi
 * /usuarios/ingresar:
 *   post:
 *     tags: [Usuarios]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioLogin'
 *     responses:
 *       200:
 *         description: Sesión iniciada, token JWT devuelto
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos de login
 */
router.post('/ingresar',
  validate('loginUser'),
  authLimiter,
  usuarioController.login
);

// =============================================
// Middleware de autenticación para rutas protegidas
// =============================================
router.use(authMiddleware.verifyToken);

// =============================================
// Endpoints protegidos (requieren autenticación)
// =============================================

/**
 * @openapi
 * /usuarios/perfil:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioPerfil'
 *       401:
 *         description: No autorizado
 */
router.get('/perfil',
  usuarioController.obtenerPerfil
);

/**
 * @openapi
 * /usuarios/{id}:
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar usuario
 *     description: Solo ADMIN o el propio usuario puede actualizar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioActualizar'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Error de validación
 *       403:
 *         description: No tienes permiso para esta acción
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id',
  authMiddleware.validateObjectId('id'),
  authMiddleware.checkOwnershipOrRole('id', ['ADMIN']),
  validate('updateUser'),
  usuarioController.actualizar
);

/**
 * @openapi
 * /usuarios/{id}:
 *   delete:
 *     tags: [Usuarios]
 *     summary: Eliminar usuario (Solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID del usuario a eliminar
 *     responses:
 *       204:
 *         description: Usuario eliminado
 *       403:
 *         description: No tienes permiso para esta acción
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id',
  authMiddleware.validateObjectId('id'),
  authMiddleware.checkRole(['ADMIN']),
  usuarioController.eliminar
);

export default router;