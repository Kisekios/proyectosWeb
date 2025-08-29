import Joi from 'joi';
import { createSafeObjectId } from '../utils/objetcIdMongoDB.js';

// Middleware para sanitizar req.params
export const sanitizarParams = (req, res, next) => {
    const schema = Joi.object({
        id: Joi.string()
            .messages({
                'string.base': 'El parámetro id debe ser una cadena'
            })
    }).unknown(false); // No se permiten otros params

    const { error, value } = schema.validate(req.params);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    const objectId = createSafeObjectId(value.id);
    req.validatedId = objectId || value.id;
    
    next();
};

// Middleware para sanitizar req.query
export const sanitizarQuerys = (req, res, next) => {
    const schema = Joi.object({
        tipo: Joi.string()
            .valid('home', 'nacionales', 'internacionales')
            .required()
            .messages({
                'any.only': 'parametro no valido',
                'any.required': 'El parámetro es obligatorio',
                'string.base': 'El parámetro debe ser una cadena'
            })
    }).unknown(false); // No se permiten otros query params

    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            error: 'Parámetros inválidos en la query string',
            detalles: error.details.map(d => d.message)
        });
    }

    req.validatedQuery = value;
    next();
};

// Middleware para bloquear cualquier query string
export const bloqReqQuery = (req, res, next) => {
    if (Object.keys(req.query).length > 0) {
        return res.status(400).json({
            error: 'No se permiten parámetros en la query string',
            detalles: req.query
        });
    }
    next();
};

// Middleware para bloquear cualquier parámetro en req.params
export const bloqReqParams = (req, res, next) => {
    if (Object.keys(req.params).length > 0) {
        return res.status(400).json({
            error: 'No se permiten parámetros en la URL',
            detalles: req.params
        });
    }
    next();
};

// Middleware para bloquear cualquier contenido en req.body
export const bloqReqBody = (req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        return res.status(400).json({
            error: 'No se permite contenido en el cuerpo de la petición',
            detalles: req.body
        });
    }
    next();
};
