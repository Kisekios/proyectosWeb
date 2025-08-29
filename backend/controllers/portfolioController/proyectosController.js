import { proyectosModel } from "../../models/portfolioModels/proyectosModels.js";
import { proyectosSchema, proyectosUpdateSchema } from "../../schems/portoflioschems/proyectosschem.js";
import formatDate from "../../utils/fecha.js";

export const proyectosController = {


    proyectos: async (req, res) => {
        try {
            const proyectos = await proyectosModel.getAll();
            res.status(200).json(proyectos);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener los proyectos: " + error.message });
        }
    },

    proyecto: async (req, res) => {
        try {
            if (!req.validatedId) {
                return res.status(400).json({ error: 'El ID del proyecto es obligatorio' });
            }

            const proyecto = await proyectosModel.getOne(req.validatedId);
            if (!proyecto) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }

            res.status(200).json(proyecto);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el proyecto: " + error.message });
        }
    },

    crear: async (req, res) => {
        try {
            if (!req.body) {
                return res.status(400).json({ error: 'No se enviaron datos.' });
            }

            const { error, value } = proyectosSchema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                return res.status(400).json({ error: error.details.map(msg => msg.message).join(', ') });
            }

            const { nombre, titulo, version, ...moreinfo } = value;

            const { nombreExiste, tituloExiste } = await proyectosModel.checkNameAndTittle(nombre, titulo);

            if (tituloExiste || nombreExiste) {
                return res.status(400).json({ error: "El nombre o titulo del proyecto ya existe" });
            }

            const now = new Date();
            const data = await proyectosModel.create({
                nombre,
                titulo,
                ...moreinfo,
                createdAt: formatDate(now),
                updatedAt: formatDate(now),
                version: version || '1.0.0'
            });

            res.status(201).json({
                message: "Proyecto creado exitosamente",
                id: data.insertedId ? data.insertedId.toString() : 'unknown-id',
                nombre: nombre
            });

        } catch (error) {
            res.status(500).json({ error: "Error al crear el proyecto: " + error.message });
        }
    },

    editar: async (req, res) => {
        try {
            if (!req.validatedId) {
                return res.status(400).json({ error: 'El ID del proyecto es obligatorio' });
            }

            const { error, value } = proyectosUpdateSchema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
            }

            const resultado = await proyectosModel.update(req.validatedId, {
                ...value,
                updatedAt: formatDate(new Date())
            });

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }

            res.status(200).json({
                message: 'Proyecto actualizado correctamente',
                cambios: value
            });
        } catch (error) {
            res.status(500).json({ error: "Error al editar el proyecto: " + error.message });
        }
    },

    borrar: async (req, res) => {
        try {
            if (!req.validatedId) {
                return res.status(400).json({ error: 'El ID del proyecto es obligatorio' });
            }

            const resultado = await proyectosModel.delete(req.validatedId);
            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }

            res.status(200).json({
                message: 'Proyecto eliminado correctamente'
            });
        } catch (error) {
            res.status(500).json({ error: "Error al borrar el proyecto: " + error.message });
        }
    }
};