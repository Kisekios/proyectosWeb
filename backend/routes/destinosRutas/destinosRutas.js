import { Router } from "express";

import { destinosController } from "../../controllers/destinosControllers/destinosController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { destinosLimiter } from "../../middlewares/rateLimiterAPI.js";
import { bloqReqQuery, bloqReqBody, bloqReqParams, sanitizarParams, sanitizarQuerys } from '../../middlewares/queryParams.js'

const router = Router()

router.use(destinosLimiter);

router.get('/informacion/:destino',
    bloqReqQuery,
    bloqReqBody,
    sanitizarParams,
    destinosController.destino
)

router.get('/destacados',
    bloqReqParams,
    bloqReqBody,
    sanitizarQuerys,
    destinosController.destacados
)

router.get('/catalogo/:destinos',
    bloqReqQuery,
    bloqReqBody,
    sanitizarParams,
    destinosController.catalogo
)

router.post('/nuevo',
    bloqReqParams,
    bloqReqQuery,
    authMiddleware(['admin']),
    destinosController.nuevo
)

router.put('/editar/:destino',
    bloqReqQuery,
    sanitizarParams,
    authMiddleware(['admin']),
    destinosController.editar
)

router.delete('/delete/:destino',
    bloqReqQuery,
    bloqReqBody,
    sanitizarParams,
    authMiddleware(['admin']),
    destinosController.borrar
)

export default router