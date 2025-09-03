import { Router } from "express";

import { usuariosController } from '../../controllers/portfolioController/usuariosController.js'
import { authMiddleware } from '../../middlewares/authMiddleware.js'
import { usuariosLimiter } from "../../middlewares/rateLimiterAPI.js"
import { bloqReqQuery, bloqReqBody, bloqReqParams, sanitizarParams } from '../../middlewares/queryParams.js'

const router = Router()

router.use(usuariosLimiter)

router.post('/ingresar',
    bloqReqParams,
    bloqReqQuery,
    usuariosController.ingresar
)

router.get('/perfiles',
    bloqReqParams,
    bloqReqQuery,
    bloqReqBody,
    authMiddleware(['admin']),
    usuariosController.perfiles
)

router.post('/registrarse',
    bloqReqParams,
    bloqReqQuery,
    authMiddleware(['admin']),
    usuariosController.registrarse
)

router.delete('/delete/:email',
    bloqReqQuery,
    bloqReqBody,
    sanitizarParams,
    authMiddleware(['admin']),
    usuariosController.borrar
)

router.get('/set-items',
    bloqReqParams,
    bloqReqQuery,
    bloqReqBody,
    authMiddleware(['admin']),
    usuariosController.setItems
)

router.put('/editar',
    bloqReqParams,
    bloqReqQuery,
    authMiddleware(['admin', 'editor']),
    usuariosController.editar
)

export default router