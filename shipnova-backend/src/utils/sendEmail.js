const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Use a default service, or environment variables
  // SMTP setup is required. For testing/MVP, ethereal or a basic gmail account is fine.
  // We'll scaffold it safely using recommended assessment patterns.
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"ShipNova Alerts" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log("Email sent: %s", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = sendEmail;
