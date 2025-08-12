import { Router } from "express";

import { usuariosController } from '../../controllers/portfolioController/usuariosController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'

const router = Router()

router.post('/ingresar', usuariosController.ingresar)

router.get('/perfiles', authMiddleware, usuariosController.perfiles)

router.post('/registrarse', authMiddleware, usuariosController.registrarse)

router.put('/editar-perfil', authMiddleware, usuariosController.editar)

router.delete('/delete', authMiddleware, usuariosController.borrar)

export default router