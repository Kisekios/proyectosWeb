import express from 'express';
import usuariosController from '../controllers/usuarioController.js';

const route = express.Router();


route.post('/registrarse', usuariosController.registrarse);
route.post('/ingresar', usuariosController.login)

export default route