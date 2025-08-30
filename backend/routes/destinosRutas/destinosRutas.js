import { Router } from "express";

import { destinosController } from "../../controllers/destinosControllers/destinosController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { destinosLimiter } from "../../middlewares/rateLimiterAPI.js";
import { bloqReqQuery, bloqReqBody, bloqReqParams, sanitizarParams, sanitizarQuerys } from '../../middlewares/queryParams.js'

const router = Router()

router.use(destinosLimiter);

router.get('/informacion/:destino',
    bloqReqBody,
    bloqReqQuery,
    sanitizarParams,
    destinosController.destino
)

router.get('/destacados',
    bloqReqBody,
    bloqReqParams,
    sanitizarQuerys,
    destinosController.destacados
)

router.get('/catalogo/:destinos',
    bloqReqBody,
    bloqReqQuery,
    sanitizarParams,
    destinosController.catalogo
)

router.post('/nuevo',
    bloqReqQuery,
    bloqReqParams,
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
    bloqReqBody,
    bloqReqQuery,
    sanitizarParams,
    authMiddleware(['admin']),
    destinosController.borrar
)

export default router