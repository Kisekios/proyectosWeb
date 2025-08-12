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

    registrarse: async (req, res) => {
        try {
            if (!req.body) {
                return res.status(400).json({ error: 'No se enviaron datos para el registro' });
            }

            const { error, value } = usuariosSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

            if (error) {
                return res.status(400).json({ error: error.details.map(msg => msg.message).join(', ') });
            }

            const { nombre, email, telefono, clave } = value;

            const { emailExistente, nombreExistente } = await usuariosModel.getOneByNameEmail(email, nombre);

            if (nombreExistente || emailExistente) {
                return res.status(400).json({ error: "El usuario o email ya existe" });
            }

            const claveEncriptada = await bcrypt.hash(clave, 10);

            const now = new Date();

            const data = await usuariosModel.create({
                nombre,
                email,
                telefono,
                clave: claveEncriptada,
                createdAt: formatDate(now),
                updatedAt: formatDate(now)
            });

            res.status(201).json({
                message: "Usuario registrado exitosamente",
                id: data.insertedId,
                email: email,
                nombre: nombre
            });

        } catch (error) {
            res.status(400).json({ error: "Error en el registro: " + error.message });
        }
    },

    ingresar: async (req, res) => {
        try {

            const { error, value } = loginSchema.validate(req.body);
            if (error) return res.status(400).json({ error: error.details[0].message })

            const { email, clave } = value;

            const usuario = await usuariosModel.getByEmail(email);

            if (!usuario) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            const claveValida = await bcrypt.compare(clave, usuario.clave);

            if (!claveValida) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            const token = generateToken(usuario);

            const { nombre } = usuario;

            res.status(200).json({
                message: "Ingreso exitoso",
                token,
                usuario: nombre
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
                value.clave = await bcrypt.hash(value.clave, 10);
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

    borrar: async (req, res) => {
        try {
            // Validación
            const { error, value } = deleteSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

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
                emailEliminado: email
            });

        } catch (error) {
            res.status(500).json({ error: "Error al borrar: " + error.message });
        }
    }
};