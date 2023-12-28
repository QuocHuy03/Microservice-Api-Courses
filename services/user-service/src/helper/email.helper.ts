import nodemailer from "nodemailer";

export const emailSMPT = {
  sendEmail: async (toEmail: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_SMTP,
        pass: process.env.EMAIL_PASSWORD_SMTP,
      },
    });
    // Thông tin người gửi và người nhận
    const mailOptions = {
      from: "qhuy.dev@gmail.com",
      to: toEmail, // Địa chỉ email của người nhận
      subject: subject,
      html: html,
    };

    // Gửi email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  },
};
