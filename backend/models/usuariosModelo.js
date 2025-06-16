import mongoose from 'mongoose'
import Usuario from '../schems/usuariosSchem.js'


class usuarioModel {
    async create(usuario) {
        return await Usuario.create(usuario);  // Usa el método de Mongoose
    }

    async getAll() {
        return await Usuario.find();  // Usa find() de Mongoose (no necesita toArray())
    }

    async getOneById(id) {
        return await Usuario.findById(id);  // ¡Método especial de Mongoose!
    }

    async getOneByEmail(email) {
        return await Usuario.findOne(email);  // ¡Método especial de Mongoose!
    }

    async update(id, usuario) {
        try {
            const usuarioActualizado = await Usuario.findByIdAndUpdate(
                id,
                usuario,
                { new: true, runValidators: true } // Devuelve el documento actualizado y valida los campos
            );
            if (!usuarioActualizado) {
                throw new Error("Usuario no encontrado");
            }
            return usuarioActualizado;
        } catch (error) {
            console.error("Error en modelo (update):", error);
            throw error; // Propaga el error para manejarlo en el controlador
        }
    }

    async delete(id) {
        try {
            const usuarioEliminado = await Usuario.findByIdAndDelete(id);
            if (!usuarioEliminado) {
                throw new Error("Usuario no encontrado");
            }
            return { message: "Usuario eliminado correctamente", id };
        } catch (error) {
            console.error("Error en modelo (delete):", error);
            throw error;
        }
    }
}

export default new usuarioModel();