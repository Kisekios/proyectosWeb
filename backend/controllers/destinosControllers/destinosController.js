import { destinosModel } from '../../models/destinosModels/destinosModels.js'
import { newDestinoSchema, updateDestinoSchema, queryDestinoSchema } from '../../schems/destinosSchems/destinosSchem.js'
import formatDate from "../../utils/fecha.js";

export const destinosController = {

    destino: async (req, res) => {
        try {
            const { id } = req.params
            const destino = await destinosModel.getOne(id)
            res.status(200).json({ id, destino })
        } catch (error) {

        }
    },

    destacados: async (req, res) => {
        try {
            const { tipo } = req.validatedQuery
            if (!tipo) res.status(400).json({error: 'parametro no valido'})
            const destacados = await destinosModel.getFeatured()
            res.status(200).json({ tipo, destacados })
        } catch (error) {

        }
    },

    catalogo: async (req, res) => {
        try {
            const { id } = req.params
            const catalogo = await destinosModel.getList()
            res.status(200).json({ id, catalogo })
        } catch (error) {

        }
    },

    nuevo: async (req, res) => {
        try {
            const { ...data } = req.body
            const newDestino = await destinosModel.create()
            res.status(200).json({ data, newDestino })
        } catch (error) {

        }
    },

    editar: async (req, res) => {
        try {
            const { id } = req.params
            const { ...data } = req.body
            const destinoUpdated = await destinosModel.update()
            res.status(200).json({ id, data, destinoUpdated })
        } catch (error) {

        }
    },

    borrar: async (req, res) => {
        try {
            const { id } = req.params
            const destinoDeleted = await destinosModel.delete()
            res.status(200).json({ id, destinoDeleted })
        } catch (error) {

        }
    }
}