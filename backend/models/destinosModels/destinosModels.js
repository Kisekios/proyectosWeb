import { destinos } from "../../index.js";
import { createSafeObjectId } from '../../utils/objetcIdMongoDB.js'

export const destinosModel = {
    getOne: async (destino) => {
        try {
            //projects
            return true
        } catch (error) {

        }
    },

    getFeatured: async (destacadosOf) => {
        try {
            //projects
            return true
        } catch (error) {

        }
    },

    getList: async (catalogoOf) => {
        try {
            //projects
            return true
        } catch (error) {

        }
    },

    create: async (nuevoDestino) => {
        try {
            //projects
            return true
        } catch (error) {

        }
    },

    update: async (updateDestino) => {
        try {
            //projects
            return true
        } catch (error) {

        }
    },

    delete: async (deleteDestino) => {
        try {
            //projects
            return true
        } catch (error) {

        }
    },

    checkNameAndTittle: async (nombre, titulo) => {
        try {
            const [nombreExiste, tituloExistente] = await Promise.all([
                destinos.collection('nacionales','internacionales').findOne({ nombre }),
                destinos.collection('destinos','internacionales').findOne({ titulo })
            ]);

            return {
                nombreExiste: !!nombreExiste,
                tituloExistente: !!tituloExistente
            };
            //projects
        } catch (error) {
            
        }
    }
}