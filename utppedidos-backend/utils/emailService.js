// ===== utils/emailService.js - MIGRADO PARA FIREBASE =====
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    // Inicializar el transportador de email
    async initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verificar conexión
            if (this.transporter && process.env.EMAIL_USER) {
                await this.transporter.verify();
                console.log('✅ Servicio de email configurado correctamente');
            }
        } catch (error) {
            console.error('❌ Error configurando servicio de email:', error);
            this.transporter = null;
        }
    }

    // Verificar si el servicio está disponible
    isAvailable() {
        return this.transporter !== null;
    }

    // Enviar email genérico
    async sendEmail({ to, subject, html, text }) {
        if (!this.isAvailable()) {
            console.warn('⚠️ Servicio de email no disponible');
            return false;
        }

        try {
            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'UTPedidos',
                    address: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER
                },
                to,
                subject,
                html,
                text
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email enviado:', result.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error enviando email:', error);
            return false;
        }
    }

    // Email de bienvenida
    async sendWelcomeEmail(userEmail, userName) {
        const subject = '¡Bienvenido a UTPedidos!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7b1fa2; color: white; padding: 20px; text-align: center;">
                    <h1>¡Bienvenido a UTPedidos!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>¡Gracias por registrarte en UTPedidos! Ahora puedes:</p>
                    <ul>
                        <li>🍽️ Explorar los menús de todas las cafeterías</li>
                        <li>📱 Hacer pedidos desde tu móvil</li>
                        <li>⏰ Evitar filas y esperas</li>
                        <li>📊 Llevar control de tus pedidos</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                           style="background: #7b1fa2; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Explorar Menús
                        </a>
                    </div>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p>¡Que disfrutes tu experiencia con UTPedidos!</p>
                </div>
                <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                    <p>Universidad Tecnológica de Panamá - UTPedidos</p>
                    <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                </div>
            </div>
        `;
        
        return await this.sendEmail({
            to: userEmail,
            subject,
            html,
            text: `¡Bienvenido a UTPedidos, ${userName}! Gracias por registrarte.`
        });
    }

    // Email de confirmación de pedido
    async sendOrderConfirmation(userEmail, orderData) {
        const subject = `Confirmación de Pedido #${orderData.id_pedido}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4caf50; color: white; padding: 20px; text-align: center;">
                    <h1>✅ Pedido Confirmado</h1>
                    <p>Pedido #${orderData.id_pedido}</p>
                </div>
                <div style="padding: 20px;">
                    <p><strong>¡Tu pedido ha sido recibido!</strong></p>
                    <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                        <p><strong>📍 Cafetería:</strong> ${orderData.cafeteria_nombre || 'N/A'}</p>
                        <p><strong>📅 Fecha:</strong> ${new Date(orderData.fecha_pedido).toLocaleString('es-PA')}</p>
                        <p><strong>💰 Total:</strong> $${orderData.total}</p>
                        <p><strong>💳 Pago:</strong> ${orderData.metodo_pago}</p>
                    </div>
                    <h3>📋 Detalles del pedido:</h3>
                    <ul>
                        ${orderData.items ? orderData.items.map(item => `
                            <li>${item.cantidad}x ${item.nombre} - $${item.subtotal}</li>
                        `).join('') : '<li>Items no disponibles</li>'}
                    </ul>
                    ${orderData.observaciones ? `<p><strong>📝 Observaciones:</strong> ${orderData.observaciones}</p>` : ''}
                    <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p><strong>⏰ Tiempo estimado de preparación: ${orderData.tiempo_estimado || 15} minutos</strong></p>
                        <p>Te notificaremos cuando tu pedido esté listo para retirar.</p>
                    </div>
                </div>
            </div>
        `;
        
        return await this.sendEmail({
            to: userEmail,
            subject,
            html,
            text: `Tu pedido #${orderData.id_pedido} ha sido confirmado. Total: $${orderData.total}`
        });
    }

    // Email de pedido listo
    async sendOrderReady(userEmail, orderData) {
        const subject = `🍽️ Tu pedido #${orderData.id_pedido} está listo`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ff9800; color: white; padding: 20px; text-align: center;">
                    <h1>🍽️ ¡Tu pedido está listo!</h1>
                    <p>Pedido #${orderData.id_pedido}</p>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p style="font-size: 18px;"><strong>¡Tu pedido ya está preparado!</strong></p>
                    <div style="background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <p><strong>📍 Retíralo en:</strong> ${orderData.cafeteria_nombre || 'Cafetería'}</p>
                        <p><strong>💰 Total a pagar:</strong> $${orderData.total}</p>
                        <p><strong>💳 Método de pago:</strong> ${orderData.metodo_pago}</p>
                    </div>
                    <p style="color: #d32f2f; font-weight: bold;">
                        ⚠️ Tienes 30 minutos para retirar tu pedido
                    </p>
                </div>
            </div>
        `;
        
        return await this.sendEmail({
            to: userEmail,
            subject,
            html,
            text: `Tu pedido #${orderData.id_pedido} está listo para retirar en ${orderData.cafeteria_nombre || 'la cafetería'}`
        });
    }

    // Email de recuperación de contraseña
    async sendPasswordReset(userEmail, resetToken, userName) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${userEmail}`;
        const subject = 'Recuperación de contraseña - UTPedidos';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #7b1fa2; color: white; padding: 20px; text-align: center;">
                    <h1>🔐 Recuperación de contraseña</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <strong>${userName}</strong>,</p>
                    <p>Hemos recibido una solicitud para recuperar tu contraseña.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #7b1fa2; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p>Este enlace es válido por 1 hora.</p>
                    <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
                </div>
            </div>
        `;
        
        return await this.sendEmail({
            to: userEmail,
            subject,
            html,
            text: `Para restablecer tu contraseña, visita: ${resetUrl}`
        });
    }
}

// Crear instancia singleton
const emailService = new EmailService();

module.exports = emailService;