import { portfolio } from '../../index.js';
import { createSafeObjectId } from '../../utils/objetcIdMongoDB.js'


export const usuariosModel = {
    getAll: async () => {
        return await portfolio.collection('usuarios').find({}).project({ clave: 0, _id: 0, updatedAt: 0 }).toArray();
    },

    getOneByNameEmail: async (email, nombre) => {
        const [emailExistente, nombreExistente] = await Promise.all([
            portfolio.collection('usuarios').findOne({ email }),
            portfolio.collection('usuarios').findOne({ nombre })
        ]);
        return { emailExistente, nombreExistente };
    },

    getByEmail: async (email) => {
        return await portfolio.collection('usuarios').findOne({ email }, { projection: { _id: 0, createdAt: 0, updatedAt: 0, telefono: 0 } })
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
    },

    incrementLoginAttempts: async (email) => {
        return await portfolio.collection('usuarios').updateOne(
            { email },
            {
                $inc: { loginAttempts: 1 },
                $set: { lastAttempt: new Date() }
            }
        );
    },

    resetLoginAttempts: async (email) => {
        return await portfolio.collection('usuarios').updateOne(
            { email },
            {
                $set: {
                    loginAttempts: 0,
                    lockedUntil: null
                }
            }
        );
    },

    lockAccount: async (email, minutes) => {
        const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
        return await portfolio.collection('usuarios').updateOne(
            { email },
            { $set: { lockedUntil } }
        );
    },

    resetIntentos: async () => {
        try {
            const result = await portfolio.collection('usuarios').updateMany(
                {},
                {
                    $set: {
                        loginAttempts: 0,
                        lastAttempt: null,
                        lockedUntil: null
                    }
                }
            );

            return (`Modificados: ${result.modifiedCount}`);
        } catch (error) {
            throw error
        }
    }
};