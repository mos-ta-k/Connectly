const nodemailer = require("nodemailer");

// communicate with SMTP server
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
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
    try{
        const info = await transporter.sendMail({
            from: `"Connectly" <${process.env.EMAIL_USER}>`,
            to,
            subject, 
            text, 
            html
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    } catch (error) {
        console.error("Error sending email:", error);
    }
};

async function sendRegisterEmail(userEmail, name){
    const subject = "Welcome to Connectly!";
    const text = `Hello ${name},\n\nThank you for registering with Connectly! We're excited to have you on board.\n\nBest regards,\nThe Connectly Team`;
    const html = `<p>Hello ${name},</p>
                  <p>Thank you for registering with Connectly! We're excited to have you on board.</p>
                  <p>Best regards,<br>The Connectly Team</p>`;
    await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendEmail, sendRegisterEmail };
