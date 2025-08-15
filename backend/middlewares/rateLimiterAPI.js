import rateLimit from 'express-rate-limit';

export const usuariosLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: '⚠️ Demasiadas solicitudes en usuarios. Intente más tarde.'
});

export const proyectosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: '⚠️ Límite de solicitudes en proyectos alcanzado.'
});

export const destinosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '⚠️ Muchas solicitudes desde esta IP. Intente nuevamente pronto.'
});