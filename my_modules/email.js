const nodemailer = require('nodemailer');

const service = process.env.ADMIN_MAIL_SERVICE;
const email = process.env.ADMIN_MAIL;
const password = process.env.ADMIN_MAIL_PWD;

const transporter = nodemailer.createTransport({
  service: service,
  auth: {
    user: email,
    pass: password
  }
});

const send_mail = (mail, done) => {

  var mailOptions = {
    from: email,
    to: mail.to,
    subject: mail.subject,
    text: mail.content
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('email: Failed to send email: ',error);
      done(false);
    } else {
      console.log('email: Email sent: ' + info.response);
      done(true);
    }
  });
};

module.exports = {
  send_mail: send_mail
};
