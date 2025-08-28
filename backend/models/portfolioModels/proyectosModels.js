import { portfolio } from "../../index.js";
import { createSafeObjectId } from '../../utils/objetcIdMongoDB.js'

export const proyectosModel = {
    getAll: async () => {
        try {
            return await portfolio.collection('proyectos').find({})
                .project({ _id: 0, updatedAt: 0, nombre: 0, createdAt: 0 })
                .sort({ createdAt: -1 })
                .toArray();
        } catch (error) {
            console.error('Error en getAll:', error);
            throw new Error('Error al obtener todos los proyectos');
        }
    },

    getOne: async (id) => {
        try {
            let query;
            const objectId = createSafeObjectId(id);

            if (objectId) {
                query = { _id: objectId };
            } else {
                // Si no es ObjectId válido, buscar por nombre
                query = { nombre: id };
            }

            const proyecto = await portfolio.collection('proyectos').findOne(query, { projection: { _id: 0, nombre: 0, createdAt: 0, updatedAt: 0 } })
            if (!proyecto) return null;

            return proyecto;
        } catch (error) {
            console.error('Error en getOne:', error);
            throw new Error('Error al obtener el proyecto');
        }
    },

    create: async (nuevoProyecto) => {
        try {
            return await portfolio.collection('proyectos').insertOne(nuevoProyecto);
        } catch (error) {
            console.error('Error en create:', error);
            throw new Error('Error al crear el proyecto');
        }
    },

    update: async (id, updateData) => {
        try {
            let query;
            const objectId = createSafeObjectId(id);

            if (objectId) {
                query = { _id: objectId };
            } else {
                // Si no es ObjectId válido, buscar por nombre
                query = { nombre: id };
            }

            return await portfolio.collection('proyectos').updateOne(
                query,
                { $set: updateData }
            );
        } catch (error) {
            console.error('Error en update:', error);
            throw new Error('Error al actualizar el proyecto');
        }
    },

    delete: async (id) => {
        try {
            let query;
            const objectId = createSafeObjectId(id);

            if (objectId) {
                query = { _id: objectId };
            } else {
                // Si no es ObjectId válido, buscar por nombre
                query = { nombre: id };
            }

            return await portfolio.collection('proyectos').deleteOne(query);
        } catch (error) {
            console.error('Error en delete:', error);
            throw new Error('Error al eliminar el proyecto');
        }
    },

    checkNameAndTitle: async (nombre, titulo) => {
        try {
            const [nombreExiste, tituloExistente] = await Promise.all([
                portfolio.collection('proyectos').findOne({ nombre }),
                portfolio.collection('proyectos').findOne({ titulo })
            ]);

            return {
                nombreExiste: !!nombreExiste,
                tituloExistente: !!tituloExistente
            };
        } catch (error) {
            console.error('Error en checkNameAndTitle:', error);
            throw new Error('Error al verificar nombre y título');
        }
    }
};