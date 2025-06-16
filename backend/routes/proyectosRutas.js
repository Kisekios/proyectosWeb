import express from 'express';
import proyectosController from '../controllers/proyectsController.js';
import { verificarToken } from '../helpers/autentificacion.js';

const route = express.Router();


route.post('/', verificarToken, proyectosController.createProyect);
route.get('/', proyectosController.getProyects);
route.get('/:id', proyectosController.getProyect);
route.put('/:id', verificarToken, proyectosController.updateProyect);
route.delete('/:id', verificarToken, proyectosController.deleteProyect);

export default route

