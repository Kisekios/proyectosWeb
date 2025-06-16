import mongoose from 'mongoose'
import Proyecto from '../schems/proyectosSchem.js'
/*import dbClient from "../config/dbClient.js"; */

/* const proyectoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    titulo: String,
    imagen: String,
    descripcion: String,
    tecnologias: Array,
    link: String
}, { timestamps: true });  // Opcional: añade createdAt y updatedAt */

// 2. Crea el modelo
/* const Proyecto = mongoose.model('Proyecto', proyectoSchema); */

class proyectoModel {
    async create(proyecto) {
        return await Proyecto.create(proyecto);  // Usa el método de Mongoose
    }

    async getAll() {
        return await Proyecto.find();  // Usa find() de Mongoose (no necesita toArray())
    }

    async getOne(id) {
        return await Proyecto.findById(id);  // ¡Método especial de Mongoose!
    }

    async update(id, proyecto) {
        try {
            const proyectoActualizado = await Proyecto.findByIdAndUpdate(
                id,
                proyecto,
                { new: true, runValidators: true } // Devuelve el documento actualizado y valida los campos
            );
            if (!proyectoActualizado) {
                throw new Error("Proyecto no encontrado");
            }
            return proyectoActualizado;
        } catch (error) {
            console.error("Error en modelo (update):", error);
            throw error; // Propaga el error para manejarlo en el controlador
        }
    }

    async delete(id) {
        try {
            const proyectoEliminado = await Proyecto.findByIdAndDelete(id);
            if (!proyectoEliminado) {
                throw new Error("Proyecto no encontrado");
            }
            return { message: "Proyecto eliminado correctamente", id };
        } catch (error) {
            console.error("Error en modelo (delete):", error);
            throw error;
        }
    }
}

export default new proyectoModel();