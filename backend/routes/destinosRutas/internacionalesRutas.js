import { Router } from "express";

import { internacionalesController } from "../../controllers/destinosControllers/internacionalesController.js";

const router = Router()

router.get('/', internacionalesController.destino)

router.get('/:id', internacionalesController.destinos)

router.get('/populares', internacionalesController.populares)

router.post('/nuevo', internacionalesController.crear)

router.put('/editar:id', internacionalesController.editar)

router.delete('/delete:id', internacionalesController.borrar)

export default router