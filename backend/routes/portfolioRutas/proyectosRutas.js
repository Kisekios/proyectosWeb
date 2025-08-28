import { Router } from "express";

import { proyectosController } from "../../controllers/portfolioController/proyectosController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { proyectosLimiter } from "../../middlewares/rateLimiterAPI.js";
import { bloqReqQuery, bloqReqBody, bloqReqParams, sanitizarParams } from '../../middlewares/queryParams.js'

const router = Router();

router.use(proyectosLimiter);

router.get('/',
    bloqReqParams,
    bloqReqBody,
    bloqReqQuery,
    proyectosController.proyectos
);

router.get('/:id',
    sanitizarParams,
    bloqReqBody,
    bloqReqQuery,
    proyectosController.proyecto
);

router.post('/crear',
    bloqReqParams,
    bloqReqQuery,
    authMiddleware(['admin']),
    proyectosController.crear
);

router.put('/editar/:id',
    sanitizarParams,
    bloqReqQuery,
    authMiddleware(['admin']),
    proyectosController.editar
);

router.delete('/delete/:id',
    sanitizarParams,
    bloqReqBody,
    bloqReqQuery,
    authMiddleware(['admin']),
    proyectosController.borrar
);

export default router;