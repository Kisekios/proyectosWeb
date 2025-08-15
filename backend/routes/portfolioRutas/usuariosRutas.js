import { Router } from "express";

import { usuariosController } from '../../controllers/portfolioController/usuariosController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import { usuariosLimiter } from "../../middlewares/rateLimiterAPI.js";

const router = Router()

router.use(usuariosLimiter)

router.post('/ingresar', usuariosController.ingresar)

router.post('/crear-admin', usuariosController.crearAdminInicial);

router.get('/set-items', (authMiddleware(['admin'])), usuariosController.setItems)

router.get('/perfiles', (authMiddleware(['admin'])), usuariosController.perfiles)

router.post('/registrarse', (authMiddleware(['admin'])), usuariosController.registrarse)

router.delete('/delete', (authMiddleware(['admin'])), usuariosController.borrar)

router.put('/editar-perfil', (authMiddleware(['admin', 'editor'])), usuariosController.editar)

export default router