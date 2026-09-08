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
  const subject = "Welcome to Connectly!";
  const text = `Hello ${name},\n\nThank you for registering with Connectly! We're excited to have you on board.\n\nBest regards,\nThe Connectly Team`;
  const html = `<p>Hello ${name},</p>
                  <p>Thank you for registering with Connectly! We're excited to have you on board.</p>
                  <p>Best regards,<br>The Connectly Team</p>`;
  await sendEmail(userEmail, subject, text, html);
}

async function sendOTPEmail(userEmail, otp, name = "User") {
  const subject = "Connectly - Your Verification OTP";
  const text = `Hello ${name},\n\nThank you for joining Connectly! Your One-Time Password (OTP) is: ${otp}\n\nThis code will expire in 10 minutes. Please do not share this code with anyone.\n\nBest regards,\nThe Connectly Team`;
  const html = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #0084e6; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Connectly</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #333333; font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
      <p style="color: #555555; font-size: 15px; line-height: 1.5;">Thank you for joining Connectly! To complete your registration, please use the One-Time Password (OTP) below:</p>
      
      <div style="background-color: #e8f4fd; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; color: #0084e6; letter-spacing: 6px; display: inline-block; padding: 10px 24px; background-color: #ffffff; border: 1px solid #bce0fd; border-radius: 6px;">${otp}</span>
      </div>
      
      <p style="color: #666666; font-size: 14px; line-height: 1.5;"><strong>Please do not share this code with anyone.</strong> This code will expire in 10 minutes.</p>
      <p style="color: #888888; font-size: 14px; margin-bottom: 0;">Best regards,<br>The Connectly Team</p>
    </div>
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee;">
      <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>`;

  await sendEmail(userEmail, subject, text, html);
}

export { sendEmail, sendRegisterEmail, sendOTPEmail };

