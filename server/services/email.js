// Email service for sending password reset emails
const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  
  // Create email HTML content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0284c7; margin: 0; font-size: 28px;">✈️ FlyNova</h1>
          <p style="color: #666; margin-top: 5px;">Virtual Airline Management Platform</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
        
        <p style="color: #555; line-height: 1.6;">Bonjour <strong>${username}</strong>,</p>
        
        <p style="color: #555; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe. 
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0284c7; 
                    color: white; 
                    padding: 14px 35px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block;
                    font-weight: bold;
                    font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        
        <p style="color: #555; line-height: 1.6; font-size: 14px;">
          Ou copiez et collez ce lien dans votre navigateur :
        </p>
        <p style="color: #0284c7; word-break: break-all; background-color: #f0f9ff; padding: 12px; border-radius: 5px; font-size: 13px;">
          ${resetUrl}
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
            ⏱️ Ce lien expirera dans <strong>1 heure</strong>.
          </p>
          <p style="color: #999; font-size: 13px; line-height: 1.6; margin-top: 10px;">
            🔒 Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 10px;">
            © ${new Date().getFullYear()} FlyNova - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  `;

  // Plain text version
  const textContent = `
FlyNova - Réinitialisation de mot de passe

Bonjour ${username},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

Ce lien expirera dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.

---
FlyNova - Virtual Airline Management Platform
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `;

  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      // SMTP not configured - log to console only
      console.log('\n========================================');
      console.log('📧 EMAIL DE RÉINITIALISATION DE MOT DE PASSE');
      console.log('========================================');
      console.log(`Destinataire: ${email}`);
      console.log(`Utilisateur: ${username}`);
      console.log(`Lien de réinitialisation: ${resetUrl}`);
      console.log('========================================\n');
      return true;
    }

    // Send email
    const mailOptions = {
      from: `"FlyNova" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - FlyNova',
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de réinitialisation envoyé avec succès:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    
    // Fallback to console logging if email fails
    console.log('\n========================================');
    console.log('📧 EMAIL DE RÉINITIALISATION (FALLBACK)');
    console.log('========================================');
    console.log(`Destinataire: ${email}`);
    console.log(`Utilisateur: ${username}`);
    console.log(`Lien de réinitialisation: ${resetUrl}`);
    console.log('========================================\n');
    
    // Don't throw error to avoid breaking the password reset flow
    // User will still get the success message
    return true;
  }
};

module.exports = {
  sendPasswordResetEmail
};

