import bcrypt from "bcrypt";

import { usuariosModel } from "../../models/portfolioModels/usuariosModels.js";
import { usuariosSchema, usuariosUpdateSchema, loginSchema, deleteSchema } from "../../schems/portoflioschems/usuariosSchem.js";
import formatDate from "../../utils/fecha.js";
import { generateToken } from '../../utils/jwtToken.js'

export const usuariosController = {
    perfiles: async (req, res) => {
        try {
            const usuarios = await usuariosModel.getAll();
            res.status(200).json(usuarios);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener perfiles" });
        }
    },

    setItems: async (req, res) => {
        try {
            const status = await usuariosModel.resetIntentos();
            res.status(200).json(status)
        } catch (error) {
            res.status(500).json({ error: "Error al setear los locksAccount", detalles: error })
        }
    },

    registrarse: async (req, res) => {
        try {
            if (!req.body) {
                return res.status(400).json({ error: 'No se enviaron datos para el registro' });
            }

            if ('rol' in req.body && req.body.rol !== 'editor') {
                return res.status(400).json({ error: 'Rol no válido' });
            }

            const { error, value } = usuariosSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

            if (error) {
                return res.status(400).json({ error: error.details.map(msg => msg.message).join(', ') });
            }

            const { nombre, email, telefono, clave, rol } = value;

            const { emailExistente, nombreExistente } = await usuariosModel.getOneByNameEmail(email, nombre);

            if (nombreExistente || emailExistente) {
                return res.status(400).json({ error: "El nombre de usuario o email ya existe" });
            }

            const claveEncriptada = await bcrypt.hash(clave, Number(process.env.HASH_SALT));

            const now = new Date();

            const data = await usuariosModel.create({
                nombre,
                email,
                telefono,
                clave: claveEncriptada,
                rol,
                createdAt: formatDate(now),
                updatedAt: formatDate(now)
            });

            res.status(201).json({
                message: "Usuario registrado exitosamente",
                email: data.email,
                nombre: data.nombre
            });

        } catch (error) {
            res.status(400).json({ error: "Error en el registro: " + error.message });
        }
    },

    ingresar: async (req, res) => {
        try {
            const MAX_ATTEMPTS = 5;
            const LOCK_TIME_MINUTES = 15;

            const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
            if (error) return res.status(400).json({ error: error.details[0].message });

            const { email, clave } = value;

            // Verificar si la cuenta está bloqueada
            const usuario = await usuariosModel.getByEmail(email);

            if (!usuario) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            if (usuario?.lockedUntil && usuario.lockedUntil > new Date()) {
                const remainingTime = Math.ceil((usuario.lockedUntil - new Date()) / (1000 * 60));
                return res.status(403).json({
                    error: `Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos`
                });
            }

            const claveValida = await bcrypt.compare(clave, usuario.clave);

            if (!claveValida) {
                // Incrementar intentos fallidos
                await usuariosModel.incrementLoginAttempts(email);

                // Bloquear cuenta si excede el límite
                if (usuario.loginAttempts >= MAX_ATTEMPTS) {
                    await usuariosModel.lockAccount(email, LOCK_TIME_MINUTES);
                    return res.status(403).json({
                        error: `Demasiados intentos fallidos. Cuenta bloqueada por ${LOCK_TIME_MINUTES} minutos`
                    });
                }

                const remainingAttempts = MAX_ATTEMPTS - usuario.loginAttempts;
                return res.status(401).json({
                    error: `Credenciales inválidas. Te quedan ${remainingAttempts} intentos`
                });
            }

            // Si la clave es válida, resetear intentos
            await usuariosModel.resetLoginAttempts(email);

            const token = generateToken(usuario);

            const { nombre } = usuario;

            res.status(200).json({
                mensaje: "Ingreso exitoso",
                usuario: nombre,
                token
            });

        } catch (error) {
            res.status(500).json({ error: "Error al ingresar: " + error.message });
        }
    },

    editar: async (req, res) => {
        try {
            const { email, ...updateData } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'El email es obligatorio para identificar al usuario' });
            }

            const { error, value } = usuariosUpdateSchema.validate(updateData, { abortEarly: false, stripUnknown: true });
            if (error) {
                return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
            }

            if (value.clave) {
                value.clave = await bcrypt.hash(value.clave, Number(process.env.HASH_SALT));
            }

            const now = new Date();
            const resultado = await usuariosModel.update(email, value, formatDate(now));

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            res.status(200).json({
                message: 'Usuario actualizado correctamente',
                cambios: value
            });

        } catch (error) {
            res.status(500).json({ error: "Error al editar: " + error.message });
        }
    },

    borrar: async (req, res) => { //se puede borrar por id, no se puede borrar el usuario principal
        try {
            const validar = { email: req.validatedId}
            // Validación
            const { error, value } = deleteSchema.validate(validar, { abortEarly: false, stripUnknown: true });

            if (error) {
                return res.status(400).json({
                    error: error.details.map(d => d.message).join(', ')
                });
            }

            const { email } = value; // Extraemos el email validado

            // Operación de eliminación
            const resultado = await usuariosModel.delete(email);

            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            res.status(200).json({
                message: 'Usuario eliminado correctamente',
                usuario: email
            });

        } catch (error) {
            res.status(500).json({ error: "Error al borrar: " + error.message });
        }
    }
};