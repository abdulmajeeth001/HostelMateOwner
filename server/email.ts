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
          <h1 style="margin: 0;">WinkStay</h1>
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
            Do not share this code with anyone. WinkStay will never ask for your OTP.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin-bottom: 10px;">
            If you didn't request this code, please ignore this email.
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 WinkStay. All rights reserved.
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

interface TenantWelcomeEmailData {
  tenantName: string;
  tenantEmail: string;
  pgName: string;
  pgAddress: string;
  roomNumber: string;
  monthlyRent: number;
  sharing: number;
}

export async function sendTenantWelcomeEmail(data: TenantWelcomeEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const subject = "Welcome to WinkStay - Your Room is Ready!";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">WinkStay</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Home Away From Home</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${data.tenantName}! 🎉</h2>
          <p style="color: #666; font-size: 14px;">
            Congratulations! Your onboarding has been approved and your room is ready for you.
          </p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">Your Accommodation Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; width: 40%;">PG Name:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.pgName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Address:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.pgAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Room Number:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Sharing Type:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.sharing} ${data.sharing === 1 ? 'Person' : 'People'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Monthly Rent:</td>
                <td style="padding: 8px 0; color: #667eea; font-size: 16px; font-weight: 700;">₹${data.monthlyRent.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background: #e8f0fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1a73e8; font-size: 14px;">📌 Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.8;">
              <li>Log in to your WinkStay account to view complete details</li>
              <li>Contact your PG owner for move-in coordination</li>
              <li>Keep track of your payment due dates</li>
              <li>Explore amenities and house rules</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            We're excited to have you as part of the WinkStay community. If you have any questions, please reach out to your PG owner or contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 WinkStay. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: gmailEmail,
      to: data.tenantEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✓ Tenant welcome email sent successfully to ${data.tenantEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send tenant welcome email to ${data.tenantEmail}:`, error);
    return false;
  }
}

interface OwnerPgWelcomeEmailData {
  ownerName: string;
  ownerEmail: string;
  pgName: string;
  pgAddress: string;
  totalRooms: number;
}

interface TenantOnboardingWithPasswordData {
  tenantName: string;
  tenantEmail: string;
  tempPassword: string;
  pgName: string;
  pgAddress: string;
  roomNumber: string;
  monthlyRent: number;
  sharing: number;
}

export async function sendTenantOnboardingWithPasswordEmail(data: TenantOnboardingWithPasswordData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const subject = "Welcome to WinkStay - Your Account & Room Details";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">WinkStay</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Home Away From Home</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Welcome to WinkStay, ${data.tenantName}! 🎉</h2>
          <p style="color: #666; font-size: 14px;">
            Your account has been created and your room is ready! Below are your login credentials and accommodation details.
          </p>
          
          <div style="background: #fff4e5; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #e65100; font-size: 14px;">🔐 Login Credentials</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; width: 50%;">Email:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.tenantEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Temporary Password:</td>
                <td style="padding: 8px 0; color: #e65100; font-size: 14px; font-weight: 700;">${data.tempPassword}</td>
              </tr>
            </table>
            <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
              ⚠️ <strong>Important:</strong> You will be required to change this password on your first login.
            </p>
          </div>

          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">Your Accommodation Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; width: 40%;">PG Name:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.pgName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Address:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.pgAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Room Number:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Sharing Type:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.sharing} ${data.sharing === 1 ? 'Person' : 'People'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Monthly Rent:</td>
                <td style="padding: 8px 0; color: #667eea; font-size: 16px; font-weight: 700;">₹${data.monthlyRent.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background: #e8f0fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1a73e8; font-size: 14px;">📌 Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.8;">
              <li>Log in to WinkStay with your email and temporary password</li>
              <li>Change your password on first login</li>
              <li>View your complete accommodation details</li>
              <li>Keep track of your payment due dates</li>
              <li>Contact your PG owner for move-in coordination</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            Welcome to the WinkStay community! If you have any questions, please reach out to your PG owner.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 WinkStay. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: gmailEmail,
      to: data.tenantEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✓ Tenant onboarding email with password sent successfully to ${data.tenantEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send tenant onboarding email to ${data.tenantEmail}:`, error);
    return false;
  }
}

interface TenantOnboardingExistingUserData {
  tenantName: string;
  tenantEmail: string;
  pgName: string;
  pgAddress: string;
  roomNumber: string;
  monthlyRent: number;
  sharing: number;
}

export async function sendTenantOnboardingExistingUserEmail(data: TenantOnboardingExistingUserData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const subject = "You've Been Onboarded - New PG Assignment";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">WinkStay</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Home Away From Home</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Good News, ${data.tenantName}! 🎉</h2>
          <p style="color: #666; font-size: 14px;">
            You've been successfully onboarded to a new PG! Your room is ready and waiting for you.
          </p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">Your New Accommodation Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; width: 40%;">PG Name:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.pgName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Address:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.pgAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Room Number:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Sharing Type:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.sharing} ${data.sharing === 1 ? 'Person' : 'People'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Monthly Rent:</td>
                <td style="padding: 8px 0; color: #667eea; font-size: 16px; font-weight: 700;">₹${data.monthlyRent.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background: #e8f0fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1a73e8; font-size: 14px;">📌 Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.8;">
              <li>Log in to your WinkStay account to view complete details</li>
              <li>Contact your PG owner for move-in coordination</li>
              <li>Keep track of your payment due dates</li>
              <li>Explore amenities and house rules</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            We're excited to have you in your new accommodation! If you have any questions, please reach out to your PG owner.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 WinkStay. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: gmailEmail,
      to: data.tenantEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✓ Tenant onboarding email (existing user) sent successfully to ${data.tenantEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send tenant onboarding email to ${data.tenantEmail}:`, error);
    return false;
  }
}

export async function sendOwnerPgWelcomeEmail(data: OwnerPgWelcomeEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const subject = "Welcome to WinkStay - Your PG is Set Up!";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">WinkStay</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Simplifying PG Management</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #333; margin-top: 0;">Welcome to WinkStay, ${data.ownerName}! 🏠</h2>
          <p style="color: #666; font-size: 14px;">
            Congratulations! Your PG has been successfully set up on WinkStay. You're now ready to streamline your hostel management operations.
          </p>
          
          <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">Your PG Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; width: 40%;">PG Name:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 600;">${data.pgName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Address:</td>
                <td style="padding: 8px 0; color: #333; font-size: 14px;">${data.pgAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px;">Total Rooms:</td>
                <td style="padding: 8px 0; color: #667eea; font-size: 16px; font-weight: 700;">${data.totalRooms}</td>
              </tr>
            </table>
          </div>

          <div style="background: #e8f0fe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1a73e8; font-size: 14px;">🚀 Get Started:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.8;">
              <li>Add rooms and define their amenities</li>
              <li>Start onboarding tenants through the platform</li>
              <li>Track payments and manage rent collection</li>
              <li>Handle visit requests and maintenance schedules</li>
              <li>Monitor occupancy and generate reports</li>
            </ul>
          </div>

          <div style="background: #fff4e5; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <h4 style="margin: 0 0 10px 0; color: #e65100; font-size: 14px;">💡 Pro Tips:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px; line-height: 1.8;">
              <li>Keep tenant information up-to-date for smooth operations</li>
              <li>Set up payment reminders to ensure timely rent collection</li>
              <li>Use the dashboard to get insights into your PG's performance</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 13px; margin-top: 20px;">
            We're thrilled to have you on board! WinkStay is here to make your PG management easier and more efficient.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 WinkStay. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: gmailEmail,
      to: data.ownerEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✓ Owner PG welcome email sent successfully to ${data.ownerEmail}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send owner PG welcome email to ${data.ownerEmail}:`, error);
    return false;
  }
}
