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
    console.error('❌ [Email Service] Critical Error: SMTP credentials are not configured. Cannot send email to:', options.email);
    throw new Error('Email service is not configured. Please set up SMTP credentials in environment variables.');
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
      html: options.html || `<div style="font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333;">${options.message.replace(/\\n/g, '<br/>')}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✨ [Email Service] Real email sent successfully: %s', info.messageId);
    return true;
  } catch (error: any) {
    console.error('❌ [Email Service] Internal Error sending email:', error.message || error);
    throw new Error(`Failed to send email: ${error.message || 'Unknown SMTP error'}`);
  }
}
