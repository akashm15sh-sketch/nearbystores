const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.gmailUser = process.env.GMAIL_USER;
    this.gmailPass = process.env.GMAIL_APP_PASSWORD;
    this.senderName = process.env.BREVO_SENDER_NAME || 'NearbyStores';

    // Initialize transporter
    if (this.gmailUser && this.gmailPass && this.gmailUser !== 'your-email@gmail.com') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.gmailUser,
          pass: this.gmailPass
        }
      });
    }
  }

  // Send email via Nodemailer (Gmail)
  async sendEmail(to, subject, htmlContent) {
    if (!this.transporter) {
      console.log('📧 [DEMO MODE] Email would be sent to:', to);
      console.log('Subject:', subject);
      console.log('⚠️  Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars.');
      return { success: true, demo: true };
    }

    try {
      const mailOptions = {
        from: `"${this.senderName}" <${this.gmailUser}>`,
        to,
        subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', to, 'Message ID:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      console.error('   Check GMAIL_USER and GMAIL_APP_PASSWORD env vars.');
      // Return gracefully instead of throwing — don't crash the request
      return { success: false, error: error.message };
    }
  }

  // Send OTP email
  async sendOTP(email, otp) {
    const subject = 'Your NearbyStores Verification Code';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { background: linear-gradient(135deg, #fff5eb 0%, #ffffff 100%); max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .otp-code { background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); color: white; font-size: 36px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 30px 0; }
          .message { color: #333; font-size: 16px; line-height: 1.6; text-align: center; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">NearbyStores</div>
          </div>
          <div class="message">
            <p>Welcome to NearbyStores! Your verification code is:</p>
          </div>
          <div class="otp-code">${otp}</div>
          <div class="message">
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 NearbyStores. Connecting you with local businesses.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  // Send proximity alert
  async sendProximityAlert(email, storeName, storeAddress) {
    const subject = `You're near ${storeName}!`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { background: linear-gradient(135deg, #fff5eb 0%, #ffffff 100%); max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .store-name { font-size: 24px; font-weight: bold; color: #ff6b35; margin: 20px 0; text-align: center; }
          .message { color: #333; font-size: 16px; line-height: 1.6; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📍 NearbyStores</div>
          </div>
          <div class="store-name">${storeName}</div>
          <div class="message">
            <p>You're passing by one of your nearby stores!</p>
            <p><strong>Location:</strong> ${storeAddress}</p>
            <p>Why not stop by and check out what they have to offer?</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  // Send store status change notification
  async sendStoreStatusChange(email, storeName, status) {
    const subject = `${storeName} is now ${status}!`;
    const statusEmoji = status === 'open' ? '🟢' : '🔴';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { background: linear-gradient(135deg, #fff5eb 0%, #ffffff 100%); max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .status { font-size: 48px; text-align: center; margin: 20px 0; }
          .message { color: #333; font-size: 16px; line-height: 1.6; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">NearbyStores</div>
          </div>
          <div class="status">${statusEmoji}</div>
          <div class="message">
            <p><strong>${storeName}</strong> is now <strong>${status.toUpperCase()}</strong>!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  // Send order confirmation
  async sendOrderConfirmation(email, orderId, storeName, totalAmount, orderType) {
    const subject = `Order Confirmed - ${storeName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { background: linear-gradient(135deg, #fff5eb 0%, #ffffff 100%); max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .message { color: #333; font-size: 16px; line-height: 1.6; }
          .total { font-size: 24px; font-weight: bold; color: #ff6b35; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🛍️ NearbyStores</div>
          </div>
          <div class="message">
            <p><strong>Your order has been confirmed!</strong></p>
            <div class="order-details">
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Store:</strong> ${storeName}</p>
              <p><strong>Order Type:</strong> ${orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</p>
            </div>
            <div class="total">Total: ₹${totalAmount}</div>
            <p>You'll receive updates as your order is prepared.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  // Send order status update
  async sendOrderStatusUpdate(email, orderId, storeName, status) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready for pickup',
      out_for_delivery: 'Your order is out for delivery',
      completed: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled'
    };

    const subject = `Order Update - ${storeName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { background: linear-gradient(135deg, #fff5eb 0%, #ffffff 100%); max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .message { color: #333; font-size: 16px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">NearbyStores</div>
          </div>
          <div class="message">
            <div class="status-update">
              <h2>${statusMessages[status] || 'Order status updated'}</h2>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Store:</strong> ${storeName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, htmlContent);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetLink) {
    const subject = 'Reset Your Password - NearbyStores';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #f97316, #f59e0b); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Password Reset</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #6B7280; font-size: 13px; text-align: center;">
              This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendEmail(email, subject, htmlContent);
  }

  // WhatsApp notification (placeholder - requires paid service)
  async sendWhatsApp(phone, message) {
    console.log('📱 [DISABLED] WhatsApp notifications require a paid service');
    console.log('Phone:', phone);
    console.log('Message:', message);
    return { success: false, reason: 'WhatsApp service not configured' };
  }
}

module.exports = new NotificationService();
