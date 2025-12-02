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

exports.sendVerificationCodeEmail = async (email, code, firstname) => {
  const mailOptions = {
    to: email,
    subject: 'Verify Your Email - Mentoring System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hi ${firstname || 'there'},</p>
        <p>Thank you for registering with the Mentoring System. Please use the verification code below to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    text: `Hi ${firstname || 'there'},\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this verification, please ignore this email.`
  };

  const sent = await sendMail(mailOptions);
  if (!sent) {
    throw new Error('VERIFICATION_EMAIL_NOT_SENT');
  }
};


