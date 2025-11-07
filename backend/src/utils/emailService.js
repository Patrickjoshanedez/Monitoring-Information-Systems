const nodemailer = require('nodemailer');

const canSendEmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_PASS);

const buildTransporter = () => {
  if (!canSendEmail) {
    console.warn('Email credentials are not configured. Outbound emails are disabled.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
};

const transporter = buildTransporter();

const sendMail = async (options) => {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.sendMail({ from: process.env.GMAIL_USER, ...options });
    return true;
  } catch (error) {
    console.error('sendMail error:', error);
    return false;
  }
};

exports.sendPasswordResetEmail = async (email, token) => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  const mailOptions = {
    to: email,
    subject: 'Password Reset',
    text: `Please click on the following link to reset your password: ${base}/reset-password/${token}`,
  };

  const sent = await sendMail(mailOptions);
  if (!sent) {
    throw new Error('EMAIL_NOT_SENT');
  }
};

exports.sendNotificationEmail = async ({ to, subject, text, html }) => {
  const sent = await sendMail({ to, subject, text, html });
  return sent;
};


