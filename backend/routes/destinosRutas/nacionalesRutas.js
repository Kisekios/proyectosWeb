import { Router } from "express";

import { nacionalesController } from "../../controllers/destinosControllers/nacionalesController.js";

const router = Router()

router.get('/', nacionalesController.destino)

router.get('/:id', nacionalesController.destinos)

router.get('/populares', nacionalesController.populares)

router.post('/nuevo', nacionalesController.crear)

router.put('/editar:id', nacionalesController.editar)

router.delete('/delete:id', nacionalesController.borrar)

export default router