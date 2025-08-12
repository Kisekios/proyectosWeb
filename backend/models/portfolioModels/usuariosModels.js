import { portfolio } from '../../index.js';

export const usuariosModel = {
    getAll: async () => {
        return await portfolio.collection('usuarios').find({}).project({ clave: 0, _id: 0 , updatedAt: 0}).toArray();
    },

    getOneByNameEmail: async (email, nombre) => {
        const [emailExistente, nombreExistente] = await Promise.all([
            portfolio.collection('usuarios').findOne({ email }),
            portfolio.collection('usuarios').findOne({ nombre })
        ]);
        return { emailExistente, nombreExistente };
    },

    getByEmail: async (email) => {
        return await portfolio.collection('usuarios').findOne({ email });
    },

    create: async (nuevoUsuario) => {
        return await portfolio.collection('usuarios').insertOne(nuevoUsuario);
    },

    update: async (email, updateData, fecha) => {
        return await portfolio.collection('usuarios').updateOne(
            { email },
            { $set: { ...updateData, updatedAt: fecha } }
        );
    },

    delete: async (email) => {
        return await portfolio.collection('usuarios').deleteOne({ email });
    }
};