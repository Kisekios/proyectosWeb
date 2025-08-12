import { verifyToken } from '../utils/jwtToken.js';
import { usuariosModel } from '../models/portfolioModels/usuariosModels.js'

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Token requerido');

        const decoded = verifyToken(token);

        // Buscar usuario por email (ya que no tienes getById)
        const usuario = await usuariosModel.getByEmail(decoded.email); // decoded.email viene del token
        if (!usuario) throw new Error('Usuario no existe');

        req.user = {
            email: usuario.email,
            nombre: usuario.nombre
        };

        next();
    } catch (error) {
        res.status(401).json({
            error: 'Acceso no autorizado',
            detalles: error.message.replace('/jwt|token/gi, ')
        });
    }
};;