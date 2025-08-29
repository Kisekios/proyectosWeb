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

router.post('/crear',
    bloqReqParams,
    bloqReqQuery,
    authMiddleware(['admin']),
    proyectosController.crear
);

router.get('/:id',
    bloqReqBody,
    bloqReqQuery,
    sanitizarParams,
    proyectosController.proyecto
);

router.put('/editar/:id',
    bloqReqQuery,
    sanitizarParams,
    authMiddleware(['admin']),
    proyectosController.editar
);

router.delete('/delete/:id',
    bloqReqBody,
    bloqReqQuery,
    sanitizarParams,
    authMiddleware(['admin']),
    proyectosController.borrar
);

export default router;