import nodemailer from "nodemailer";

const gmailEmail = process.env.GMAIL_EMAIL;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

let transporter: any = null;

function getTransporter() {
  if (!transporter) {
    if (!gmailEmail || !gmailPassword) {
      throw new Error("Gmail credentials not configured in environment variables");
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });
  }
  return transporter;
}

export async function sendOtpEmail(email: string, otp: string, purpose: string = "registration"): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const subject = purpose === "forgot_password" ? "Password Reset OTP" : "Email Verification OTP";
    const message = purpose === "forgot_password" 
      ? `Your password reset OTP is: ${otp}. This code expires in 15 minutes.`
      : `Your email verification OTP is: ${otp}. This code expires in 10 minutes.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">HostelMate</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <p style="color: #666; font-size: 14px;">Hi,</p>
          <p style="color: #666; font-size: 14px;">${message}</p>
          
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; color: #999; font-size: 12px;">Your OTP Code</p>
            <h1 style="margin: 10px 0; color: #667eea; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          </div>

          <p style="color: #666; font-size: 13px; margin-bottom: 20px;">
            Do not share this code with anyone. HostelMate will never ask for your OTP.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin-bottom: 10px;">
            If you didn't request this code, please ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 HostelMate. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: gmailEmail,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log(`✓ OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send OTP email to ${email}:`, error);
    return false;
  }
}
