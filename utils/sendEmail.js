// const nodemailer = require('nodemailer');
// const dns = require('dns');
// dns.setDefaultResultOrder('ipv4first');

// const sendEmail = async (to, subject, text) => {
//   const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // false = use STARTTLS (TLS), not SSL
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     text
//   });
// };

// module.exports = sendEmail;

// const nodemailer = require('nodemailer');
// const dns = require('dns');
// dns.setDefaultResultOrder('ipv4first');

// //connect to nodemiler
// const sendEmail = async (to, subject, text) => {
//   const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // false = use STARTTLS (TLS), not SSL
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     text
//   });
// };

// module.exports = sendEmail;

const nodemailer = require("nodemailer");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

// text = required, html = optional
const sendEmail = async (to, subject, text, html = null) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Online Bookstore" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  if (html) {
    mailOptions.html = html;
  }

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
