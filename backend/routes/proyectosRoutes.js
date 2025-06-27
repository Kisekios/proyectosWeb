import { Router } from 'express';
import { proyectosController } from '../controllers/proyectosController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validatorMiddleware.js';
import cacheMiddleware from '../middlewares/cacheMiddleware.js'; // Middleware de caché

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Proyectos
 *   description: Gestión de proyectos
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// =============================================
// Middleware condicional de autenticación
// =============================================
router.use((req, res, next) => {
  // Solo requerir autenticación para métodos que no sean GET
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    authMiddleware.verifyToken(req, res, next);
  } else {
    next();
  }
});

// =============================================
// Endpoints de proyectos
// =============================================

/**
 * @openapi
 * /proyectos:
 *   post:
 *     tags: [Proyectos]
 *     summary: Crear nuevo proyecto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProyectoCrear'
 *     responses:
 *       201:
 *         description: Proyecto creado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.post('/',
  authMiddleware.checkRole(['ADMIN', 'CREATOR', 'USER']),
  validate('createProject'),
  proyectosController.crear
);

/**
 * @openapi
 * /proyectos:
 *   get:
 *     tags: [Proyectos]
 *     summary: Obtener todos los proyectos (públicos)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados (paginación)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proyecto'
 */
router.get('/',
  cacheMiddleware('5 minutes'), // Cachear respuesta por 5 minutos
  proyectosController.obtenerTodos
);

/**
 * @openapi
 * /proyectos/{id}:
 *   get:
 *     tags: [Proyectos]
 *     summary: Obtener proyecto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Detalles del proyecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proyecto'
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id',
  authMiddleware.validateObjectId('id'),
  cacheMiddleware('5 minutes'),
  proyectosController.obtenerPorId
);

/**
 * @openapi
 * /proyectos/{id}:
 *   put:
 *     tags: [Proyectos]
 *     summary: Actualizar proyecto
 *     description: Solo ADMIN o el creador pueden actualizar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID del proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProyectoActualizar'
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *       400:
 *         description: Error de validación
 *       403:
 *         description: No tienes permiso para esta acción
 *       404:
 *         description: Proyecto no encontrado
 */
router.put('/:id',
  authMiddleware.validateObjectId('id'),
  authMiddleware.checkOwnershipOrRole('creatorId', ['ADMIN']),
  validate('updateProject'),
  proyectosController.actualizar
);

/**
 * @openapi
 * /proyectos/{id}:
 *   delete:
 *     tags: [Proyectos]
 *     summary: Eliminar proyecto (Solo ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongoId
 *         description: ID del proyecto
 *     responses:
 *       204:
 *         description: Proyecto eliminado
 *       403:
 *         description: No tienes permiso para esta acción
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete('/:id',
  authMiddleware.validateObjectId('id'),
  authMiddleware.checkRole(['ADMIN']),
  proyectosController.eliminar
);

export default router;
