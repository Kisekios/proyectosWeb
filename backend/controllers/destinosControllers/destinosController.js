import { destinosModel } from '../../models/destinosModels/destinosModels.js'
import { newDestinoSchema, updateDestinoSchema } from '../../schems/destinosSchems/destinosSchem.js'
import formatDate from "../../utils/fecha.js";

export const destinosController = {

    destino: async (req, res) => {
        try {
            const { destino } = req.validatedParams
            if (!destino) return res.status(400).json({ error: 'parametro no valido' })

            const resultado = await destinosModel.getOne(destino)
            if (!resultado) {
                return res.status(404).json({ error: "Destino no encontrado" });
            }
            res.status(200).json({ resultado, destino })
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    },

    destacados: async (req, res) => {
        try {
            const { tipo } = req.validatedQuery
            if (!tipo) res.status(400).json({ error: 'parametro no valido' })

            const destacados = await destinosModel.getFeatured(tipo)
            if (!destacados) {
                return res.status(404).json({ error: "Destacados no encontrado" });
            }
            res.status(200).json({ tipo, destacados })
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    },

    catalogo: async (req, res) => {
        try {
            const { destinos } = req.validatedParams
            if (!destinos) return res.status(400).json({ error: 'parametro no valido' })

            const catalogo = await destinosModel.getList(destinos)
            res.status(200).json({ destinos, catalogo })
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    },

    nuevo: async (req, res) => {
        try {
            const { nombre, titulo, ...data } = req.body
            const { nombreExiste, tituloExiste } = await destinosModel.checkNameAndTittle(nombre, titulo);
            if (nombreExiste || tituloExiste) res.status(400).json({ error: 'Nombre o titulo ya existentes' })
            //validacion con el schem
            const newDestino = await destinosModel.create(/* value del schem */)
            res.status(200).json({ data, newDestino })
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    },

    editar: async (req, res) => {
        try {
            const { destino } = req.validatedParams

            if (!destino) return res.status(400).json({ error: 'parametro no valido' })
            const { ...data } = req.body
            //validacion con el schem
            const destinoUpdated = await destinosModel.update(destino, { ...data, updatedAt: formatDate(new Date()) })
            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }
            res.status(200).json({ destino, destinoUpdated })
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    },

    borrar: async (req, res) => {
        try {
            const { destino } = req.validatedParams

            if (!destino) return res.status(400).json({ error: 'parametro no valido' })
            const destinoDeleted = await destinosModel.delete(destino)
            if (resultado.deletedCount === 0) {
                return res.status(404).json({ error: "Proyecto no encontrado" });
            }
            res.status(200).json({ destino, destinoDeleted })
        } catch (error) {
            res.status(500).json({ error: "Error al obtener el destino: " + error.message });
        }
    }
}