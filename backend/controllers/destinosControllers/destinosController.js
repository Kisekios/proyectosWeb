import { destinosModel } from '../../models/destinosModels/destinosModels.js'
import { newDestinoSchema, updateDestinoSchema } from '../../schems/destinosSchems/destinosSchem.js'
import formatDate from "../../utils/fecha.js";

export const destinosController = {

    destino: async (req, res) => {
        try {
            const { destino } = req.validatedParams;

            if (!destino) {
                return res.status(400).json({ error: 'Parámetro destino es obligatorio' });
            }

            const resultado = await destinosModel.getOne(destino);

            if (!resultado) {
                return res.status(404).json({ error: "Destino no encontrado" });
            }

            res.status(200).json(resultado);

        } catch (error) {
            console.error('Error en destino:', error);
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    },

    destacados: async (req, res) => {
        try {
            const { tipo } = req.validatedQuery;

            if (!tipo) {
                return res.status(400).json({ error: 'Parámetro tipo es obligatorio' });
            }

            const destacados = await destinosModel.getFeatured(tipo);

            if (!destacados || destacados.length === 0) {
                return res.status(404).json({ error: "No se encontraron destinos destacados" });
            }

            res.status(200).json({
                tipo,
                cantidad: destacados.length,
                destacados
            });

        } catch (error) {
            console.error('Error en destacados:', error);
            res.status(500).json({ error: "Error al obtener destinos destacados: " + error.message });
        }
    },

    catalogo: async (req, res) => {
        try {
            const { destinos } = req.validatedParams;

            if (!destinos) {
                return res.status(400).json({ error: 'Parámetro tipo es obligatorio' });
            }

            const catalogo = await destinosModel.getList(destinos);

            if (catalogo <= 0) return res.status(400).json({ advertencia: 'No se encontraron destinos ' + destinos })

            res.status(200).json({
                tipo: destinos,
                cantidad: catalogo.length,
                catalogo
            });

        } catch (error) {
            console.error('Error en catalogo:', error);
            res.status(500).json({ error: "Error al obtener catálogo: " + error.message });
        }
    },

    nuevo: async (req, res) => {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ error: 'No se enviaron datos para crear el destino' });
            }

            const { error, value } = newDestinoSchema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                return res.status(400).json({
                    error: "Datos de entrada inválidos",
                    detalles: error.details.map(detail => detail.message)
                });
            }

            const { id, titulo } = value;

            const { nombreExiste, tituloExistente } = await destinosModel.checkNameAndTittle(id, titulo);

            if (nombreExiste) {
                return res.status(409).json({ error: 'Ya existe un destino con ese ID' });
            }

            if (tituloExistente) {
                return res.status(409).json({ error: 'Ya existe un destino con ese título' });
            }

            const now = new Date();
            await destinosModel.create({
                ...value,
                createdAt: formatDate(now),
                updatedAt: formatDate(now)
            });

            res.status(201).json({
                message: 'Destino creado exitosamente',
                destino: {
                    id: id,
                    titulo: titulo,
                    tipo: value.tipo
                }
            });

        } catch (error) {
            console.error('Error en nuevo:', error);

            if (error.message.includes('duplicate') || error.code === 11000) {
                return res.status(409).json({ error: "El destino ya existe" });
            }

            res.status(500).json({ error: "Error al crear destino: " + error.message });
        }
    },

    editar: async (req, res) => {
        try {
            const { destino } = req.validatedParams;

            if (!destino) {
                return res.status(400).json({ error: 'Parámetro destino es obligatorio' });
            }

            const destinoExistente = await destinosModel.getOne(destino);
            if (!destinoExistente) {
                return res.status(404).json({ error: "Destino no encontrado" });
            }

            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ error: 'No se enviaron datos para actualizar' });
            }

            const { error, value } = updateDestinoSchema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                return res.status(400).json({
                    error: "Datos de actualización inválidos",
                    detalles: error.details.map(detail => detail.message)
                });
            }

            if (value.titulo && value.titulo !== destinoExistente.titulo) {
                const { tituloExistente } = await destinosModel.checkNameAndTittle(null, value.titulo);
                if (tituloExistente) {
                    return res.status(409).json({ error: 'Ya existe otro destino con ese título' });
                }
            }

            const updateData = {
                ...value,
                updatedAt: formatDate(new Date())
            };

            const resultado = await destinosModel.update(destino, updateData);

            if (resultado.matchedCount === 0) {
                return res.status(404).json({ error: "Destino no encontrado" });
            }

            res.status(200).json({
                message: 'Destino actualizado correctamente',
                cambios: value
            });

        } catch (error) {
            console.error('Error en editar:', error);
            res.status(500).json({ error: "Error al editar destino: " + error.message });
        }
    },

    borrar: async (req, res) => {
        try {
            const { destino } = req.validatedParams;

            if (!destino) {
                return res.status(400).json({ error: 'Parámetro destino es obligatorio' });
            }

            const destinoExistente = await destinosModel.getOne(destino);
            if (!destinoExistente) {
                return res.status(404).json({ error: "Destino no encontrado" });
            }

            const resultado = await destinosModel.delete(destino);

            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Destino no encontrado" });
            }

            res.status(200).json({
                message: 'Destino eliminado correctamente',
                destinoEliminado: destinoExistente.titulo || destinoExistente.id
            });

        } catch (error) {
            console.error('Error en borrar:', error);
            res.status(500).json({ error: "Error al eliminar destino: " + error.message });
        }
    }
};