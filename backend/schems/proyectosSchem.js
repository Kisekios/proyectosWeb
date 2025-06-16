import mongoose from "mongoose";

const proyectoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    imagen: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    tecnologias: {
        type: Array,
        required: true
    },
    link: {
        type: String,
        required: true
    }
}, { timestamps: true });  // Opcional: añade createdAt y updatedAt

export default mongoose.model('proyectos', proyectoSchema)