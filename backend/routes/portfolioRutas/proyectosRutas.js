import { Router } from "express";

import { proyectosController } from "../../controllers/portfolioController/proyectosController.js";

const router = Router()

router.get('/',proyectosController.proyecto )

router.get('/:id',proyectosController.proyectos )

router.post('/crear',proyectosController.crear )

router.put('/editar:id',proyectosController.editar )

router.delete('/delete:id',proyectosController.borrar)


export default router