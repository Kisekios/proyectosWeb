import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'project_invite',
            'project_update',
            'task_assignment',
            'comment_mention',
            'system_alert'
        ]
    },
    message: {
        type: String,
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto'
    },
    read: {
        type: Boolean,
        default: false
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Índices para mejor performance
notificacionSchema.index({ userId: 1, read: 1 });
notificacionSchema.index({ createdAt: -1 });
notificacionSchema.index({ projectId: 1 });

export default mongoose.model('Notificacion', notificacionSchema);