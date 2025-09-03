import { destinos } from "../../index.js";

export const destinosModel = {
    getOne: async (destinoIdentifier) => {
        try {
            const colecciones = ['nacionales', 'internacionales'];

            for (const coleccion of colecciones) {
                const destino = await destinos.collection(coleccion).findOne({
                    $or: [
                        { id: destinoIdentifier },
                        { titulo: destinoIdentifier }
                    ]
                }, {
                    projection: { createdAt: 0, updatedAt: 0, _id: 0 }
                });

                if (destino) {
                    return { destino };
                }
            }

            return null;

        } catch (error) {
            console.error('Error en getOne:', error);
            throw new Error('Error al obtener el destino');
        }
    },

    getFeatured: async (tipo) => {
        try {
            let query = {};
            let projection = { titulo: 1, banner: 1, id: 1, _id: 0 };

            if (tipo === 'home') {
                query = { 'destacado.0': true };
                const [nacionales, internacionales] = await Promise.all([
                    destinos.collection('nacionales').find(query, { projection }).toArray(),
                    destinos.collection('internacionales').find(query, { projection }).toArray()
                ]);
                return [...nacionales, ...internacionales];

            } else if (tipo === 'nacional') {
                query = { 'destacado.1': true };
                return await destinos.collection('nacionales').find(query, { projection }).toArray();

            } else if (tipo === 'internacional') {
                query = { 'destacado.1': true };
                return await destinos.collection('internacionales').find(query, { projection }).toArray();

            } else {
                throw new Error('Tipo de destacados no válido');
            }

        } catch (error) {
            console.error('Error en getFeatured:', error);
            throw new Error('Error al obtener destinos destacados: ' + error.message);
        }
    },

    getList: async (tipo) => {
        try {
            return await destinos.collection(tipo).find({}, {
                projection: { titulo: 1, id: 1, _id: 0 }
            }).toArray();

        } catch (error) {
            console.error('Error en getList:', error);
            throw new Error('Error al obtener catálogo: ' + error.message);
        }
    },

    create: async (nuevoDestino) => {
        try {
            const { tipo } = nuevoDestino;
            const coleccion = tipo + 'es'; // Convierte "nacional" a "nacionales"

            const result = await destinos.collection(coleccion).insertOne(nuevoDestino);
            return { insertedId: result.insertedId, ...nuevoDestino };

        } catch (error) {
            console.error('Error en create:', error);
            if (error.code === 11000) throw new Error('El destino ya existe');
            throw new Error('Error al crear destino: ' + error.message);
        }
    },

    update: async (destinoIdentifier, updateData) => {
        try {
            const colecciones = ['nacionales', 'internacionales'];

            for (const coleccion of colecciones) {
                const result = await destinos.collection(coleccion).updateOne(
                    { $or: [{ id: destinoIdentifier }, { nombre: destinoIdentifier }] },
                    { $set: updateData }
                );
                if (result.matchedCount > 0) return result;
            }

            return { matchedCount: 0, modifiedCount: 0 };

        } catch (error) {
            console.error('Error en update:', error);
            if (error.code === 11000) throw new Error('Conflicto de duplicados');
            throw new Error('Error al actualizar destino: ' + error.message);
        }
    },

    delete: async (destinoIdentifier) => {
        try {
            const colecciones = ['nacionales', 'internacionales'];

            for (const coleccion of colecciones) {
                const result = await destinos.collection(coleccion).deleteOne(
                    { $or: [{ id: destinoIdentifier }, { nombre: destinoIdentifier }] }
                );
                if (result.deletedCount > 0) return result;
            }

            return { deletedCount: 0 };

        } catch (error) {
            console.error('Error en delete:', error);
            throw new Error('Error al eliminar destino: ' + error.message);
        }
    },

    checkNameAndTittle: async (nombre, titulo) => {
        try {
            const colecciones = ['nacionales', 'internacionales'];
            let nombreExiste = false, tituloExistente = false;

            for (const coleccion of colecciones) {
                const queries = [];
                if (nombre) queries.push(destinos.collection(coleccion).findOne({
                    $or: [{ id: nombre }, { nombre: nombre }]
                }));
                if (titulo) queries.push(destinos.collection(coleccion).findOne({ titulo }));

                if (queries.length > 0) {
                    const results = await Promise.all(queries);
                    if (nombre && results[0]) nombreExiste = true;
                    if (titulo && results[nombre ? 1 : 0]) tituloExistente = true;
                    if (nombreExiste && tituloExistente) break;
                }
            }

            return { nombreExiste, tituloExistente };

        } catch (error) {
            console.error('Error en checkNameAndTittle:', error);
            throw new Error('Error al verificar nombre y título: ' + error.message);
        }
    }
};