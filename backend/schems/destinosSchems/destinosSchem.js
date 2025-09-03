import Joi from 'joi'

const planSchema = Joi.object({
    plan: Joi.string().trim().required().valid('sencillo', 'completo', 'resort'),
    hoteles: Joi.array().items(Joi.string().trim()).min(1).required()
});

const actividadSchema = Joi.object({
    actividad: Joi.string().trim().required(),
    imagen: Joi.string().uri({ allowRelative: true }).required()
});

export const newDestinoSchema = Joi.object({
    id: Joi.string().trim().required(),
    titulo: Joi.string().trim().required(),
    tipo: Joi.string().valid('nacional', 'internacional').required(),
    destacado: Joi.array().items(Joi.boolean()).min(1).max(2).required(),
    banner: Joi.string().uri({ allowRelative: true }).required(),
    bannerGrande: Joi.alternatives().try(Joi.string().uri({ allowRelative: true }), Joi.boolean().valid(false)),
    descripcion: Joi.string().trim().required(),
    incluye: Joi.string().trim().required(),
    planes: Joi.array().items(planSchema).min(1).max(3).required(),
    actividades: Joi.array().items(actividadSchema).min(1).required(),
    informacion: Joi.array().items(Joi.string().trim()).min(1).required()
}).unknown(false);

export const updateDestinoSchema = Joi.object({
    titulo: Joi.string().trim(),
    tipo: Joi.string().valid('nacional', 'internacional'),
    destacado: Joi.array().items(Joi.boolean()).min(1).max(2),
    banner: Joi.string().uri({ allowRelative: true }),
    bannerGrande: Joi.alternatives().try(Joi.string().uri({ allowRelative: true }), Joi.boolean().valid(false)),
    descripcion: Joi.string().trim(),
    incluye: Joi.string().trim(),
    planes: Joi.array().items(planSchema).min(1).max(3),
    actividades: Joi.array().items(actividadSchema).min(1),
    informacion: Joi.array().items(Joi.string().trim())
}).unknown(false);