const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const t = getTransporter();
  return t.sendMail({ from: process.env.EMAIL_FROM || 'Gatherly <no-reply@gatherly.local>', to, subject, text, html });
};

module.exports = { sendEmail };
