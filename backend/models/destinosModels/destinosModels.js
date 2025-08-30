import { destinos } from "../../index.js";
import { createSafeObjectId } from '../../utils/objetcIdMongoDB.js'

export const destinosModel = {
    getOne: async (destino) => {
        try {

            //Envia practimanete toda la info
            //projects { createdAT: 0, updatedAt:0, _id:0 }
            return destino
        } catch (error) {

        }
    },

    getFeatured: async (destacadosOf) => {
        try {
            //projects {titulo:1 ,imagen: 1, url: 1, _id:0}
            return destacadosOf
        } catch (error) {

        }
    },

    getList: async (catalogoOf) => {
        try {
            //projects {titulo:1 , url: 1 _id:0}
            return catalogoOf
        } catch (error) {

        }
    },

    create: async (nuevoDestino) => {
        try {
            //projects
            return nuevoDestino
        } catch (error) {

        }
    },

    update: async (updateDestino) => {
        try {
            //projects
            return updateDestino
        } catch (error) {

        }
    },

    delete: async (deleteDestino) => {
        try {
            //projects
            return deleteDestino
        } catch (error) {

        }
    },

    checkNameAndTittle: async (nombre, titulo) => {
        try {
            const colecciones = await destinos.listCollections().toArray();

            let nombreExiste = false;
            let tituloExistente = false;

            for (const { name } of colecciones) {
                const [nombreMatch, tituloMatch] = await Promise.all([
                    destinos.collection(name).findOne({ nombre }, { projection: { nombre: 1, _id: 0 } }),
                    destinos.collection(name).findOne({ titulo }, { projection: { titulo: 1, _id: 0 } })
                ]);

                if (nombreMatch) return nombreExiste = true;
                if (tituloMatch) return tituloExistente = true;
            }

            return {
                nombreExiste: false,
                tituloExistente: false
            };

            //projects
        } catch (error) {

        }
    }
}