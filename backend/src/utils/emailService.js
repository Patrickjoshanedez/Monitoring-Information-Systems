const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

exports.sendPasswordResetEmail = async (email, token) => {
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  const mailOptions = {
    to: email,
    from: process.env.GMAIL_USER,
    subject: 'Password Reset',
    text: `Please click on the following link to reset your password: ${base}/reset-password/${token}`
  };
  await transporter.sendMail(mailOptions);
};


