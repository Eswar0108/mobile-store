const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

const send = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[EMAIL SKIP] To: ${to} | Subject: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'MobileStore'}" <${process.env.EMAIL_FROM || 'noreply@mobilestore.in'}>`,
    to,
    subject,
    html,
  });
};

const sendWelcome = (to, name) =>
  send({
    to,
    subject: 'Welcome to MobileStore!',
    html: `<h2>Welcome, ${name}!</h2><p>Thanks for joining MobileStore. Start exploring the best smartphones.</p>`,
  });

const sendOrderConfirmation = (to, name, orderId) =>
  send({
    to,
    subject: `Order Confirmed — #${orderId}`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>#${orderId}</strong> has been confirmed. We'll keep you updated on every step.</p>`,
  });

const sendOrderStatusUpdate = (to, name, orderId, status) =>
  send({
    to,
    subject: `Order Update — #${orderId}`,
    html: `<h2>Hi ${name},</h2><p>Your order <strong>#${orderId}</strong> status has been updated to <strong>${status}</strong>.</p>`,
  });

const sendReturnUpdate = (to, name, returnId, status) =>
  send({
    to,
    subject: `Return Update — #${returnId}`,
    html: `<h2>Hi ${name},</h2><p>Your return request <strong>#${returnId}</strong> status: <strong>${status}</strong>.</p>`,
  });

const sendRefundUpdate = (to, name, amount, status) =>
  send({
    to,
    subject: `Refund ${status}`,
    html: `<h2>Hi ${name},</h2><p>Your refund of <strong>₹${amount}</strong> has been ${status.toLowerCase()}.</p>`,
  });

const sendPasswordReset = (to, name, otp) =>
  send({
    to,
    subject: 'Password Reset OTP — MobileStore',
    html: `<h2>Hi ${name},</h2><p>Your OTP for password reset is: <strong>${otp}</strong>. Valid for 10 minutes.</p>`,
  });

const sendLowStockAlert = (to, productName, stock) =>
  send({
    to,
    subject: `Low Stock Alert: ${productName}`,
    html: `<p>Product <strong>${productName}</strong> is low on stock. Current stock: <strong>${stock}</strong> units.</p>`,
  });

const sendNewReturnAlert = (to, returnId, productName) =>
  send({
    to,
    subject: `New Return Request — #${returnId}`,
    html: `<p>A new return has been requested for <strong>${productName}</strong> (Return ID: <strong>#${returnId}</strong>).</p>`,
  });

const sendNewReviewAlert = (to, productName) =>
  send({
    to,
    subject: `New Review Pending: ${productName}`,
    html: `<p>A new review for <strong>${productName}</strong> is pending moderation.</p>`,
  });

module.exports = {
  sendWelcome,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendReturnUpdate,
  sendRefundUpdate,
  sendPasswordReset,
  sendLowStockAlert,
  sendNewReturnAlert,
  sendNewReviewAlert,
};
