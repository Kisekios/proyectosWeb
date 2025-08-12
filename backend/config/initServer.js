import Joi from 'joi';
import { startServer } from '../routes/serverRoutes.js'

// Esquema de validación para las variables de entorno

const envSchema = Joi.object({
  // Requeridos para todos los entornos
  PORT: Joi.number().port().required(),
  ALLOWED_ORIGINS: Joi.string().required(),
  JWT_SECRET: Joi.string().min(8).required(), // Mínimo 8 caracteres por seguridad
  NODE_ENV: Joi.string()
    .valid('desarrollo', 'produccion')
    .required()
    .messages({
      'any.only': 'NODE_ENV debe ser "desarrollo" o "produccion"',
    }),

  // Variables opcionales (ejemplo)
  DEBUG_MODE: Joi.boolean().optional(),

}).unknown(true); // Permite otras variables no definidas en el esquema

export const validateEnv = async () => {
  const { error } = envSchema.validate(process.env, {
    abortEarly: false, // Muestra todos los errores, no solo el primero
  });

  if (error) {
    const errorDetails = error.details.map(detail => detail.message).join(', ');
    throw new Error(`❌ Configuración de entorno inválida (${process.env.NODE_ENV}): ${errorDetails}`);
  }

  console.log(`\n✅ Variables de entorno validadas correctamente (Entorno: ${process.env.NODE_ENV})`);

  try {
    startServer();
  } catch (error) {
    throw new Error(error);
  }
};



