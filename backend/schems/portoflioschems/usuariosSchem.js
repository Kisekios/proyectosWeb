import Joi from 'joi';

//schema para crear un usuario (create)
export const usuariosSchema = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.base': 'El nombre debe ser una cadena',
      'string.empty': 'El nombre es requerido',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede superar los 50 caracteres',
      'any.required': 'El nombre es obligatorio'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'string.empty': 'El email es requerido',
      'any.required': 'El email es obligatorio'
    }),

  telefono: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'El teléfono debe tener exactamente 10 dígitos (formato CO)',
      'string.empty': 'El teléfono es requerido',
      'any.required': 'El teléfono es obligatorio'
    }),

  clave: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'La clave debe tener al menos 6 caracteres',
      'string.empty': 'La clave es requerida',
      'any.required': 'La clave es obligatoria'
    }),

  rol: Joi.string()
    .valid('editor')
    .default('editor')
    .messages({
      'any.only': 'Rol Error'
    }),

  loginAttempts: Joi.number()
    .default(0),

  lastAttempt: Joi.date(),

  lockedUntil: Joi.date()
    .allow(null)
});

//Schema para update daaa xD
export const usuariosUpdateSchema = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(50)
    .messages({
      'string.base': 'El nombre debe ser una cadena',
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede superar los 50 caracteres'
    }),

  telefono: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.pattern.base': 'El teléfono debe tener exactamente 10 dígitos (formato CO)'
    }),

  clave: Joi.string()
    .min(6)
    .messages({
      'string.min': 'La clave debe tener al menos 6 caracteres'
    })
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar'
});

// Añadimos mensajes personalizados para el login
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es obligatorio'
  }),
  clave: Joi.string().required().messages({
    'any.required': 'La clave es obligatoria'
  })
});

// Schema para eliminación
export const deleteSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'El email debe ser válido',
      'any.required': 'El email es obligatorio para eliminar'
    })
});
