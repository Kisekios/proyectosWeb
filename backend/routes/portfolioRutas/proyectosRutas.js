import { Router } from "express";

import { proyectosController } from "../../controllers/portfolioController/proyectosController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { proyectosLimiter } from "../../middlewares/rateLimiterAPI.js";
import { bloqReqQuery, bloqReqBody, bloqReqParams, sanitizarParams } from '../../middlewares/queryParams.js'

const router = Router();

router.use(proyectosLimiter);

router.get('/',
    bloqReqParams,
    bloqReqQuery,
    bloqReqBody,
    proyectosController.proyectos
);

router.post('/crear',
    bloqReqParams,
    bloqReqQuery,
    authMiddleware(['admin']),
    proyectosController.crear
);

router.get('/:proyecto',
    bloqReqQuery,
    bloqReqBody,
    sanitizarParams,
    proyectosController.proyecto
);

router.put('/editar/:proyecto',
    bloqReqQuery,
    sanitizarParams,
    authMiddleware(['admin']),
    proyectosController.editar
);

router.delete('/delete/:proyecto',
    bloqReqQuery,
    bloqReqBody,
    sanitizarParams,
    authMiddleware(['admin']),
    proyectosController.borrar
);

export default router;