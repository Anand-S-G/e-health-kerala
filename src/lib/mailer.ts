import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTP(to: string, code: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Your E-Health Kerala Verification Code',
    text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h2 style="color: #1f2937;">E-Health Kerala Verification</h2>
        <p style="color: #4b5563;">Your verification code is:</p>
        <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; display: inline-block; border: 1px solid #e5e7eb;">
            <h1 style="color: #0ea5e9; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">It will expire in 10 minutes. Do not share this code with anyone.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
