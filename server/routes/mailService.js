const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'mgl1send@gmail.com',
        pass: 'indn iusf sfty fsas'
    }
    // user: 'oritkoreng@gmail.com',
        // pass: 'npmn bbgv ftux rvrj'
});


// Function to send an email
const sendPasswordEmail = (email, newPassword) => {
  let mailOptions = {
    from: 'MobileGroup <mgl1send@gmail.com>',
    to: email,
    subject: 'Your New Password',
    text: `Your new password is: ${newPassword}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error occurred:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendPasswordEmail };
