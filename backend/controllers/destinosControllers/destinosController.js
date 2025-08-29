import { destinosModel } from '../../models/destinosModels/destinosModels.js'
import { newDestinoSchema, updateDestinoSchema } from '../../schems/destinosSchems/destinosSchem.js'
import formatDate from "../../utils/fecha.js";

export const destinosController = {

    destino: async (req, res) => {
        try {
            if (!req.validatedId) return res.status(400).json({ error: 'parametro no valido' })
            const destino = await destinosModel.getOne(req.validatedId)
            res.status(200).json({ dato: req.validatedId, destino })
        } catch (error) {

        }
    },

    destacados: async (req, res) => {
        try {
            const { tipo } = req.validatedQuery
            if (!tipo) res.status(400).json({ error: 'parametro no valido' })
            const destacados = await destinosModel.getFeatured()
            res.status(200).json({ tipo, destacados })
        } catch (error) {

        }
    },

    catalogo: async (req, res) => {
        try {
            if (!req.validatedId) return res.status(400).json({ error: 'parametro no valido' })
            const catalogo = await destinosModel.getList()
            res.status(200).json({ dato: req.validatedId, catalogo })
        } catch (error) {

        }
    },

    nuevo: async (req, res) => {
        try {
            const { nombre, titulo, ...data } = req.body
            const { nombreExiste, tituloExiste } = await destinosModel.checkNameAndTittle(nombre, titulo);

            const newDestino = await destinosModel.create()
            res.status(200).json({ data, newDestino })
        } catch (error) {

        }
    },

    editar: async (req, res) => {
        try {
            if (!req.validatedId) return res.status(400).json({ error: 'parametro no valido' })
            const { ...data } = req.body

            const destinoUpdated = await destinosModel.update(req.validatedId, { ...data, updatedAt: formatDate(new Date()) })
            res.status(200).json({ id, data, destinoUpdated })
        } catch (error) {

        }
    },

    borrar: async (req, res) => {
        try {
            if (!req.validatedId) return res.status(400).json({ error: 'parametro no valido' })
            const destinoDeleted = await destinosModel.delete(req.validatedId)
            res.status(200).json({ dato: req.validatedId, destinoDeleted })
        } catch (error) {

        }
    }
}