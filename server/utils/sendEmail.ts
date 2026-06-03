import nodemailer from 'nodemailer';

interface SendEmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'Luxe Market <no-reply@luxemarket.app>';

  // Check if SMTP configuration is provided
  if (!host || !user || !pass) {
    console.warn(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  [EMAIL SIMULATION]
To: ${options.email}
Subject: ${options.subject}
Message: ${options.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ To enable real outgoing email delivery, please configure SMTP credentials in your .env.example/environment variables:
- SMTP_HOST
- SMTP_PORT (defaults to 587)
- SMTP_USER
- SMTP_PASS
- SMTP_FROM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    return false; // Simulating email
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333;">${options.message.replace(/\n/g, '<br/>')}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✨ [Email Service] Real email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ [Email Service] Error sending real email, falling back to log simulation:', error);
    return false;
  }
}
