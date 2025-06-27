import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Usuario from '../models/usuariosModelo.js';
import { cache } from './cacheMiddleware.js';

// Configuración de paths para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

// Cargar plantillas de email
const templates = {
    welcome: loadTemplate('welcome.html'),
    verification: loadTemplate('verification.html'),
    passwordReset: loadTemplate('password-reset.html'),
    projectInvitation: loadTemplate('project-invitation.html'),
    notification: loadTemplate('notification.html')
};

/**
 * Carga una plantilla de email desde el sistema de archivos
 * @param {string} templateName 
 * @returns {HandlebarsTemplateDelegate}
 */
function loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '../email-templates', templateName);
    const source = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(source);
}

/**
 * Servicio para enviar emails
 */
const emailService = {
    /**
     * Envía email de bienvenida al usuario registrado
     * @param {string} email 
     * @param {string} nombre 
     * @returns {Promise<boolean>}
     */
    async sendWelcomeEmail(email, nombre) {
        const context = {
            appName: process.env.APP_NAME,
            nombre,
            supportEmail: process.env.SUPPORT_EMAIL,
            currentYear: new Date().getFullYear(),
            frontendUrl: process.env.FRONTEND_URL
        };

        return this._sendEmail({
            to: email,
            subject: `Bienvenido a ${process.env.APP_NAME}`,
            html: templates.welcome(context)
        });
    },

    /**
     * Envía email de verificación de cuenta
     * @param {string} email 
     * @param {string} token 
     * @returns {Promise<boolean>}
     */
    async sendVerificationEmail(email, token) {
        // Obtener usuario para personalizar el email
        const usuario = await Usuario.findOne({ email })
            .select('nombre')
            .lean();

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const context = {
            appName: process.env.APP_NAME,
            nombre: usuario?.nombre || 'Usuario',
            verificationUrl,
            supportEmail: process.env.SUPPORT_EMAIL,
            currentYear: new Date().getFullYear(),
            expiresIn: '24 horas'
        };

        return this._sendEmail({
            to: email,
            subject: `Verifica tu cuenta en ${process.env.APP_NAME}`,
            html: templates.verification(context)
        });
    },

    /**
     * Envía email para resetear contraseña
     * @param {string} email 
     * @param {string} token 
     * @returns {Promise<boolean>}
     */
    async sendPasswordResetEmail(email, token) {
        // Obtener usuario para personalizar el email
        const usuario = await Usuario.findOne({ email })
            .select('nombre')
            .lean();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        const context = {
            appName: process.env.APP_NAME,
            nombre: usuario?.nombre || 'Usuario',
            resetUrl,
            supportEmail: process.env.SUPPORT_EMAIL,
            currentYear: new Date().getFullYear(),
            expiresIn: '1 hora',
            ipAddress: 'N/A' // Podrías capturar la IP de la solicitud
        };

        return this._sendEmail({
            to: email,
            subject: `Restablece tu contraseña en ${process.env.APP_NAME}`,
            html: templates.passwordReset(context)
        });
    },

    /**
     * Envía invitación a un proyecto
     * @param {string} email 
     * @param {string} inviterName 
     * @param {string} projectName 
     * @param {string} projectId 
     * @returns {Promise<boolean>}
     */
    async sendProjectInvitation(email, inviterName, projectName, projectId) {
        const invitationUrl = `${process.env.FRONTEND_URL}/projects/${projectId}/join`;
        
        const context = {
            appName: process.env.APP_NAME,
            inviterName,
            projectName,
            invitationUrl,
            supportEmail: process.env.SUPPORT_EMAIL,
            currentYear: new Date().getFullYear()
        };

        return this._sendEmail({
            to: email,
            subject: `${inviterName} te ha invitado a un proyecto en ${process.env.APP_NAME}`,
            html: templates.projectInvitation(context)
        });
    },

    /**
     * Envía notificación por email
     * @param {Object} notification 
     * @returns {Promise<boolean>}
     */
    async sendNotificationEmail(notification) {
        const user = await Usuario.findById(notification.userId)
            .select('nombre email preferenciasNotificaciones')
            .lean();

        if (!user || user.preferenciasNotificaciones?.email === false) {
            return false;
        }

        const context = {
            appName: process.env.APP_NAME,
            nombre: user.nombre,
            message: notification.message,
            actionUrl: notification.projectId 
                ? `${process.env.FRONTEND_URL}/projects/${notification.projectId}`
                : `${process.env.FRONTEND_URL}/notifications`,
            supportEmail: process.env.SUPPORT_EMAIL,
            currentYear: new Date().getFullYear(),
            notificationSettingsUrl: `${process.env.FRONTEND_URL}/settings/notifications`
        };

        return this._sendEmail({
            to: user.email,
            subject: `Tienes una nueva notificación en ${process.env.APP_NAME}`,
            html: templates.notification(context)
        });
    },

    /**
     * Método interno para enviar emails
     * @private
     * @param {Object} mailOptions 
     * @returns {Promise<boolean>}
     */
    async _sendEmail(mailOptions) {
        if (process.env.NODE_ENV === 'test') {
            console.log('Simulando envío de email en entorno de prueba:', mailOptions);
            return true;
        }

        try {
            // Cachear el email para evitar envíos duplicados
            const cacheKey = `email:${mailOptions.to}:${mailOptions.subject}`;
            const isSent = await cache.get(cacheKey);
            
            if (isSent) {
                console.log(`Email ya fue enviado recientemente a ${mailOptions.to}: ${mailOptions.subject}`);
                return false;
            }

            const info = await transporter.sendMail({
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
                ...mailOptions
            });

            console.log(`Email enviado a ${mailOptions.to}: ${info.messageId}`);
            
            // Cachear por 1 hora para evitar envíos duplicados
            await cache.set(cacheKey, 'true', 3600);
            
            return true;
        } catch (error) {
            console.error('Error enviando email:', error);
            throw error;
        }
    }
};

export default emailService;