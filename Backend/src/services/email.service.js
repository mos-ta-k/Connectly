import nodemailer from "nodemailer";
import config from "../configs/config.js";
import { generateOTP } from "../utils/utils.js";

// communicate with SMTP server
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: config.EMAIL_USER,
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    refreshToken: config.REFRESH_TOKEN,
  },
});

//verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take messages");
  }
});

//send email
const sendEmail = async (to, subject, text, html) => {
  if (process.env.SKIP_EMAIL === "true") {
    console.log(`[Mock Email] Skipped SMTP sending in test mode to: ${to}`);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: `"Connectly" <${config.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegisterEmail(userEmail, name) {
  const subject = "Welcome to Connectly! 🎉 Your Account is Verified";
  const text = `Hello ${name},\n\nWelcome to Connectly! Your email has been successfully verified, and your account is now ready.\n\nHere is what you can do next:\n- Connect with friends and team members\n- Share real-time messages and updates\n- Personalize your profile\n\nThank you for joining us!\n\nBest regards,\nThe Connectly Team`;

  const html = `
  <div style="background-color: #f4f7fa; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e9ecef;">
      
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #0084e6 0%, #0056b3 100%); padding: 36px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Connectly</h1>
        <p style="color: #d0e7ff; margin: 8px 0 0 0; font-size: 14px; font-weight: 400;">Connect seamlessly, anywhere.</p>
      </div>

      <!-- Main Body -->
      <div style="padding: 36px 30px; color: #2d3748;">
        <h2 style="color: #1a202c; font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Welcome aboard, ${name}! 👋</h2>
        
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
          Your email address has been successfully verified. We are thrilled to have you as part of the Connectly community!
        </p>

        <!-- Feature Cards Container -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 28px;">
          <h3 style="color: #2d3748; font-size: 14px; font-weight: 600; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">Here is what you can do now:</h3>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px;">💬</td>
              <td style="padding: 8px 0; font-size: 14px; color: #4a5568; line-height: 1.5;">
                <strong>Instant Messaging:</strong> Start real-time chats with your friends and team.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px;">⚡</td>
              <td style="padding: 8px 0; font-size: 14px; color: #4a5568; line-height: 1.5;">
                <strong>Live Presence:</strong> See who is online and active in real-time.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px;">👤</td>
              <td style="padding: 8px 0; font-size: 14px; color: #4a5568; line-height: 1.5;">
                <strong>Custom Profile:</strong> Add an avatar and personalized bio to express yourself.
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-bottom: 0;">
          If you ever need help or have questions, feel free to reach out to our support team.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0;">
        <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Connectly Inc. All rights reserved.</p>
        <p style="margin: 0;">This is an automated operational message regarding your Connectly account.</p>
      </div>

    </div>
  </div>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendOTPEmail(userEmail, otp, name = "User") {
  const subject = "Connectly - Your Verification OTP";
  const text = `Hello ${name},\n\nThank you for joining Connectly! Your One-Time Password (OTP) is: ${otp}\n\nThis code will expire in 10 minutes. Please do not share this code with anyone.\n\nBest regards,\nThe Connectly Team`;

  const html = `
  <div style="background-color: #f4f7fa; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e9ecef;">
      
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, #0084e6 0%, #0056b3 100%); padding: 36px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Connectly</h1>
        <p style="color: #d0e7ff; margin: 8px 0 0 0; font-size: 14px; font-weight: 400;">Security & Verification</p>
      </div>

      <!-- Main Body -->
      <div style="padding: 36px 30px; color: #2d3748;">
        <h2 style="color: #1a202c; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Verify your email address</h2>
        
        <p style="font-size: 15px; line-height: 1.6; color: #4a5568; margin-bottom: 24px;">
          Hello <strong>${name}</strong>,<br>
          Thank you for joining Connectly! To complete your registration, please use the One-Time Password (OTP) code below:
        </p>

        <!-- OTP Box -->
        <div style="background-color: #ebf8ff; border: 1px dashed #3182ce; border-radius: 10px; padding: 24px; margin: 28px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: 800; color: #2b6cb0; letter-spacing: 8px; display: inline-block; padding: 8px 24px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);">${otp}</span>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #4a5568;">Valid for <strong>10 minutes</strong></p>
        </div>

        <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-bottom: 0;">
          <strong>Security Tip:</strong> Never share this OTP with anyone. Connectly employees will never ask for your verification code.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0;">
        <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Connectly Inc. All rights reserved.</p>
        <p style="margin: 0;">This is an automated operational message regarding your account registration.</p>
      </div>

    </div>
  </div>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendPasswordResetEmail(userEmail, otp, name = "User") {
  const subject = "Connectly - Password Reset Code";
  const text = `Hello ${name},\n\nYour Connectly password reset code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.\n\nBest regards,\nThe Connectly Team`;
  const html = `
  <div style="background-color: #f4f7fa; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 36px 30px; color: #2d3748;">
      <h1 style="color: #0056b3; margin-top: 0;">Connectly</h1>
      <h2>Password reset requested</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Use the code below to reset your password:</p>
      <p style="font-size: 36px; font-weight: 800; color: #2b6cb0; letter-spacing: 8px; text-align: center;">${otp}</p>
      <p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
  </div>`;

  await sendEmail(userEmail, subject, text, html);
}

export {
  sendEmail,
  sendRegisterEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
};

