import Joi from 'joi';

const tecnologiasPermitidas = [
    'JS', 'HTML', 'CSS', 'Node', 'Express', 'MongoDB',
    'Angular', 'React', 'Vue', 'TypeScript', 'Jest',
    'Next.js', 'SASS', 'Tailwind', 'PostgreSQL', 'Docker'
];

export const proyectosSchema = Joi.object({
    nombre: Joi.string().min(3).max(50).required().messages({
        'string.base': 'El nombre debe ser una cadena',
        'string.empty': 'El nombre es requerido',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 50 caracteres',
        'any.required': 'El nombre es obligatorio'
    }),

    titulo: Joi.string().min(3).max(100).required().messages({
        'string.base': 'El título debe ser una cadena',
        'string.empty': 'El título es requerido',
        'string.min': 'El título debe tener al menos 3 caracteres',
        'string.max': 'El título no puede superar los 100 caracteres',
        'any.required': 'El título es obligatorio'
    }),

    imagen: Joi.string().uri().required().messages({
        'string.uri': 'El link de imagen debe ser una URL válida',
        'any.required': 'El link de imagen es obligatorio'
    }),

    descripcion: Joi.string().min(10).max(500).required().messages({
        'string.base': 'La descripción debe ser una cadena',
        'string.empty': 'La descripción es requerida',
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede superar los 500 caracteres',
        'any.required': 'La descripción es obligatoria'
    }),

    tecnologias: Joi.array()
        .items(Joi.string().valid(...tecnologiasPermitidas))
        .min(1)
        .required()
        .messages({
            'array.base': 'Las tecnologías deben estar en un arreglo',
            'array.min': 'Debes incluir al menos una tecnología',
            'any.required': 'Las tecnologías son obligatorias'
        }),

    link: Joi.string().uri().required().messages({
        'string.uri': 'El link del proyecto debe ser una URL válida',
        'any.required': 'El link del proyecto es obligatorio'
    }),

    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).default('1.0.0').messages({
        'string.pattern.base': 'La versión debe tener formato semántico (ej. 1.0.0)'
    })
});

export const proyectosUpdateSchema = Joi.object({
    nombre: Joi.string().min(3).max(50).messages({
        'string.base': 'El nombre debe ser una cadena',
        'string.min': 'El nombre debe tener al menos 3 caracteres',
        'string.max': 'El nombre no puede superar los 50 caracteres'
    }),

    titulo: Joi.string().min(3).max(100).messages({
        'string.base': 'El título debe ser una cadena',
        'string.min': 'El título debe tener al menos 3 caracteres',
        'string.max': 'El título no puede superar los 100 caracteres'
    }),

    imagen: Joi.string().uri().messages({
        'string.uri': 'El link de imagen debe ser una URL válida'
    }),

    descripcion: Joi.string().min(10).max(500).messages({
        'string.base': 'La descripción debe ser una cadena',
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede superar los 500 caracteres'
    }),

    tecnologias: Joi.array()
        .items(Joi.string().valid(...tecnologiasPermitidas))
        .min(1)
        .messages({
            'array.base': 'Las tecnologías deben estar en un arreglo',
            'array.min': 'Debes incluir al menos una tecnología'
        }),

    link: Joi.string().uri().messages({
        'string.uri': 'El link del proyecto debe ser una URL válida'
    }),

    version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).messages({
        'string.pattern.base': 'La versión debe tener formato semántico (ej. 1.0.0)'
    })

}).min(1).messages({
    'object.min': 'Debes enviar al menos un campo para actualizar'
});