import nodemailer from 'nodemailer';
import Usuario from '../models/usuariosModelo.js';
import Notificacion from '../models/notificacionesModelo.js';
import { io } from '../app.js'; // Asumiendo que tienes Socket.io configurado
import { cache } from './cacheMiddleware.js';

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

// Tipos de notificación soportados
const NOTIFICATION_TYPES = {
    PROJECT_INVITE: 'project_invite',
    PROJECT_UPDATE: 'project_update',
    TASK_ASSIGNMENT: 'task_assignment',
    COMMENT_MENTION: 'comment_mention',
    SYSTEM_ALERT: 'system_alert'
};

/**
 * Servicio de notificaciones
 */
const notificationService = {
    /**
     * Notifica a colaboradores sobre cambios en un proyecto
     * @param {string} projectId - ID del proyecto
     * @param {Array<string>} userIds - IDs de usuarios a notificar
     * @param {string} type - Tipo de notificación (de NOTIFICATION_TYPES)
     * @param {Object} data - Datos adicionales para la notificación
     */
    async notifyCollaborators(projectId, userIds, type = NOTIFICATION_TYPES.PROJECT_UPDATE, data = {}) {
        try {
            if (!userIds || userIds.length === 0) return;

            // Validar el tipo de notificación
            if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
                throw new Error(`Tipo de notificación no válido: ${type}`);
            }

            // Obtener información del proyecto desde caché o DB
            let project = await cache.get(`project:${projectId}`);
            if (!project) {
                project = await Proyecto.findById(projectId)
                    .select('nombre creador')
                    .lean();

                if (project) {
                    await cache.set(`project:${projectId}`, project, 3600); // Cachear por 1 hora
                }
            }

            // Obtener información de los usuarios
            const users = await Usuario.find({ _id: { $in: userIds } })
                .select('email nombre socketId preferenciasNotificaciones')
                .lean();

            if (users.length === 0) return;

            // Preparar el contenido base de la notificación
            const baseNotification = {
                type,
                projectId,
                projectName: project?.nombre || 'Proyecto desconocido',
                timestamp: new Date(),
                read: false,
                data
            };

            // Procesar notificaciones para cada usuario
            const notifications = users.map(user => ({
                ...baseNotification,
                userId: user._id,
                message: this._getNotificationMessage(type, user, project, data)
            }));

            // Enviar notificaciones por diferentes canales
            await Promise.all([
                this._saveToDatabase(notifications),
                this._sendEmails(notifications),
                this._sendWebSocketNotifications(notifications)
            ]);

            return notifications.length;
        } catch (error) {
            console.error('Error en notificationService.notifyCollaborators:', error);
            throw error;
        }
    },

    /**
     * Guarda notificaciones en la base de datos
     * @private
     */
    async _saveToDatabase(notifications) {
        try {
            await Notificacion.insertMany(notifications);
        } catch (error) {
            console.error('Error guardando notificaciones en DB:', error);
            throw error;
        }
    },

    /**
     * Envía notificaciones por email
     * @private
     */
    async _sendEmails(notifications) {
        try {
            const emailsToSend = notifications
                .filter(notif => {
                    const userPrefs = notif.user?.preferenciasNotificaciones?.email || true;
                    return userPrefs !== false;
                })
                .map(notif => ({
                    to: notif.user.email,
                    subject: this._getEmailSubject(notif.type),
                    html: this._getEmailHtml(notif)
                }));

            if (emailsToSend.length === 0) return;

            await Promise.all(
                emailsToSend.map(email =>
                    transporter.sendMail({
                        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
                        ...email
                    }).catch(error =>
                        console.error(`Error enviando email a ${email.to}:`, error)
                    )
                )
            );
        } catch (error) {
            console.error('Error enviando emails de notificación:', error);
            throw error;
        }
    },

    /**
     * Envía notificaciones por WebSocket
     * @private
     */
    async _sendWebSocketNotifications(notifications) {
        try {
            notifications.forEach(notif => {
                if (notif.user.socketId) {
                    io.to(notif.user.socketId).emit('new_notification', {
                        ...notif,
                        user: undefined // No enviar datos sensibles del usuario
                    });
                }
            });
        } catch (error) {
            console.error('Error enviando notificaciones por WebSocket:', error);
            throw error;
        }
    },

    /**
     * Obtiene el mensaje de notificación según el tipo
     * @private
     */
    _getNotificationMessage(type, user, project, data) {
        const messages = {
            [NOTIFICATION_TYPES.PROJECT_INVITE]: `Has sido invitado al proyecto "${project?.nombre}"`,
            [NOTIFICATION_TYPES.PROJECT_UPDATE]: `El proyecto "${project?.nombre}" ha sido actualizado`,
            [NOTIFICATION_TYPES.TASK_ASSIGNMENT]: `Se te ha asignado una nueva tarea en "${project?.nombre}"`,
            [NOTIFICATION_TYPES.COMMENT_MENTION]: `Has sido mencionado en un comentario en "${project?.nombre}"`,
            [NOTIFICATION_TYPES.SYSTEM_ALERT]: data.message || 'Tienes una nueva notificación del sistema'
        };

        return messages[type] || 'Tienes una nueva notificación';
    },

    /**
     * Obtiene el asunto del email según el tipo
     * @private
     */
    _getEmailSubject(type) {
        const subjects = {
            [NOTIFICATION_TYPES.PROJECT_INVITE]: 'Invitación a proyecto',
            [NOTIFICATION_TYPES.PROJECT_UPDATE]: 'Proyecto actualizado',
            [NOTIFICATION_TYPES.TASK_ASSIGNMENT]: 'Nueva tarea asignada',
            [NOTIFICATION_TYPES.COMMENT_MENTION]: 'Has sido mencionado',
            [NOTIFICATION_TYPES.SYSTEM_ALERT]: 'Notificación del sistema'
        };

        return subjects[type] || 'Tienes una nueva notificación';
    },

    /**
     * Genera el HTML del email de notificación
     * @private
     */
    _getEmailHtml(notification) {
        // Plantilla básica de email (puedes mejorarla con un template engine)
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
                    .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>${this._getEmailSubject(notification.type)}</h2>
                    </div>
                    <div class="content">
                        <p>Hola ${notification.user?.nombre || 'Usuario'},</p>
                        <p>${notification.message}</p>
                        ${notification.projectId ? `
                        <p>
                            <a href="${process.env.FRONTEND_URL}/projects/${notification.projectId}" class="btn">
                                Ver proyecto
                            </a>
                        </p>
                        ` : ''}
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Tu Aplicación'}. Todos los derechos reservados.</p>
                        <p>
                            <a href="${process.env.FRONTEND_URL}/notifications/settings">
                                Configurar preferencias de notificación
                            </a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
};

export default notificationService;