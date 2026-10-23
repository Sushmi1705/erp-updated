const nodemailer = require('nodemailer');

const isSmtpConfigured = () => !!(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

const createTransporter = () => {
  if (!isSmtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
};

exports.sendPasswordResetEmail = async (email, resetUrl) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`[EMAIL-SERVICE] SMTP not configured. Password reset email skipped for: ${email}. Configure SMTP_HOST/USER/PASS in .env to enable.`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@precisionauto.com',
      to: email,
      subject: 'Precision Auto ERP — Password Reset Request',
      html: `<p>You requested a password reset. Click the link below (valid 10 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`
    });
    return true;
  } catch (err) {
    console.error('[EMAIL-SERVICE] Failed to send password reset email:', err.message);
    return false;
  }
};
