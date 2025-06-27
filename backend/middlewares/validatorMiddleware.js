import { validationResult, body } from 'express-validator';
import { isValidObjectId } from 'mongoose';

/**
 * Middleware para validar datos de entrada con express-validator
 */
const validate = (validationRules) => [
    // Aplicar reglas de validación
    ...validationRules,
    
    // Middleware para manejar los resultados de la validación
    (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                })),
                timestamp: new Date().toISOString()
            });
        }
        
        next();
    }
];

/**
 * Esquemas de validación reutilizables
 */
const validationSchemas = {
    registerUser: [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/).withMessage('El nombre solo puede contener letras y espacios'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
            
        body('telefono')
            .trim()
            .notEmpty().withMessage('El teléfono es requerido')
            .isMobilePhone('es-MX').withMessage('Teléfono inválido'),
            
        body('clave')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
            .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
            .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
    ],
    
    loginUser: [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es requerido')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
            
        body('clave')
            .notEmpty().withMessage('La contraseña es requerida')
    ],
    
    updateUser: [
        body('nombre')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
            .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/).withMessage('El nombre solo puede contener letras y espacios'),
            
        body('telefono')
            .optional()
            .trim()
            .isMobilePhone('es-MX').withMessage('Teléfono inválido'),
            
        body('avatar')
            .optional()
            .isURL().withMessage('La URL del avatar no es válida')
    ],
    
    createProject: [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre del proyecto es requerido')
            .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
            
        body('descripcion')
            .trim()
            .notEmpty().withMessage('La descripción es requerida')
            .isLength({ min: 20, max: 2000 }).withMessage('La descripción debe tener entre 20 y 2000 caracteres'),
            
        body('tecnologias')
            .isArray({ min: 1, max: 15 }).withMessage('Debe especificar entre 1 y 15 tecnologías')
            .custom(techs => techs.every(tech => typeof tech === 'string')).withMessage('Las tecnologías deben ser strings'),
            
        body('enlaceDemo')
            .optional()
            .isURL().withMessage('La URL del demo no es válida'),
            
        body('enlaceRepositorio')
            .optional()
            .isURL().withMessage('La URL del repositorio no es válida')
            .custom(url => 
                url.includes('github.com') || 
                url.includes('gitlab.com') || 
                url.includes('bitbucket.org')
            ).withMessage('Debe ser una URL de GitHub, GitLab o Bitbucket')
    ],
    
    updateProject: [
        body('nombre')
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
            
        body('descripcion')
            .optional()
            .trim()
            .isLength({ min: 20, max: 2000 }).withMessage('La descripción debe tener entre 20 y 2000 caracteres'),
            
        body('tecnologias')
            .optional()
            .isArray({ min: 1, max: 15 }).withMessage('Debe especificar entre 1 y 15 tecnologías')
            .custom(techs => techs.every(tech => typeof tech === 'string')).withMessage('Las tecnologías deben ser strings'),
            
        body('estado')
            .optional()
            .isIn(['DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED']).withMessage('Estado no válido'),
            
        body('fechaInicio')
            .optional()
            .isISO8601().withMessage('Fecha de inicio no válida')
            .toDate(),
            
        body('fechaFin')
            .optional()
            .isISO8601().withMessage('Fecha de fin no válida')
            .toDate()
            .custom((value, { req }) => {
                if (req.body.fechaInicio && value < req.body.fechaInicio) {
                    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
                }
                return true;
            })
    ],
    
    objectId: (field = 'id') => [
        body(field).optional().custom(value => {
            if (!isValidObjectId(value)) {
                throw new Error('ID no válido');
            }
            return true;
        }),
        
        param(field).optional().custom(value => {
            if (!isValidObjectId(value)) {
                throw new Error('ID no válido');
            }
            return true;
        })
    ]
};

export { validate, validationSchemas };