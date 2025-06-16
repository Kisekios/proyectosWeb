import mongoose from "mongoose";

const usuariosSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    telefono: {
        type: Number,
        required: true
    },
    clave: {
        type: String,
        required: true
    }
}, { timestamps: true });  // Opcional: añade createdAt y updatedAt

export default mongoose.model('usuarios', usuariosSchema)